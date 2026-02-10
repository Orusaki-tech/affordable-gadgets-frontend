'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';
import { ApiService, OpenAPI, OrdersService, OrderRequest, Order, InitiatePaymentRequestRequest, LoginService, RegisterService } from '@/lib/api/generated';
import { inventoryBaseUrl, setAuthToken } from '@/lib/api/openapi';
import { PaymentMethodModal } from './PaymentMethodModal';
import { brandConfig } from '@/lib/config/brand';

interface CheckoutModalProps {
  onClose: () => void;
  totalValue: number;
}

export function CheckoutModal({ onClose, totalValue }: CheckoutModalProps) {
  const { checkout, cart } = useCart();
  const router = useRouter();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [allowGuestCheckout, setAllowGuestCheckout] = useState(false);
  const [authForm, setAuthForm] = useState({
    username_or_email: '',
    username: '',
    email: '',
    password: '',
  });
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [leadReference, setLeadReference] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'quote' | 'pay_now'>('pay_now'); // Default to pay now
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Check if cart is already submitted
  const isCartSubmitted = cart?.is_submitted || false;

  // Auto-fill form when phone number is entered
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (formData.customer_phone) {
        localStorage.setItem('customer_phone', formData.customer_phone);
      } else {
        localStorage.removeItem('customer_phone');
      }
    }

    const recognizeCustomer = async () => {
      if (formData.customer_phone && formData.customer_phone.length >= 10) {
        setIsRecognizing(true);
        try {
          const response = await ApiService.apiV1PublicCartRecognizeRetrieve(formData.customer_phone);
          if ((response as any).is_returning_customer && (response as any).customer) {
            const customer = (response as any).customer;
            setFormData((prev) => ({
              ...prev,
              customer_name: customer.name || prev.customer_name,
              customer_email: customer.email || prev.customer_email,
              delivery_address: customer.delivery_address || prev.delivery_address,
            }));
          }
        } catch (err) {
          // Silently fail - customer might be new
        } finally {
          setIsRecognizing(false);
        }
      }
    };

    const timeoutId = setTimeout(recognizeCustomer, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.customer_phone]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAuthenticated(!!localStorage.getItem('auth_token'));
    }
  }, []);

  useEffect(() => {
    if (paymentMode !== 'pay_now') {
      setShowAuthGate(false);
      setAuthMode(null);
      setAllowGuestCheckout(false);
      setAuthError(null);
    }
  }, [paymentMode]);

  const openLogin = () => {
    setAuthError(null);
    setAuthMode('login');
    setAuthForm((prev) => ({
      ...prev,
      username_or_email: prev.username_or_email || formData.customer_email || '',
    }));
  };

  const openRegister = () => {
    setAuthError(null);
    setAuthMode('register');
    setAuthForm((prev) => ({
      ...prev,
      email: prev.email || formData.customer_email || '',
      username: prev.username || (formData.customer_email ? formData.customer_email.split('@')[0] : ''),
    }));
  };

  const handleAuthBack = () => {
    setShowAuthGate(false);
    setAuthMode(null);
    setAuthError(null);
  };

  const performCheckout = async () => {
    
    // Prevent submission if cart is already submitted
    if (isCartSubmitted) {
      setError('This cart has already been submitted. Please start a new order.');
      return;
    }

    if (paymentMode === 'pay_now' && !isAuthenticated && !allowGuestCheckout) {
      setShowAuthGate(true);
      return;
    }
    
    setError(null);
    setIsSubmitting(true);

    try {
      if (paymentMode === 'pay_now') {
        try {
          // Create order and initiate payment
          if (!cart || !cart.items || cart.items.length === 0) {
            setError('Cart is empty');
            setIsSubmitting(false);
            return;
          }

          // Prepare order items from cart
          // Note: inventory_unit_id is write_only in the API, so we need to use inventory_unit.id
          const orderItems = cart.items.map(item => {
            const unitId = item.inventory_unit?.id;
            if (!unitId) {
              throw new Error(`Missing inventory_unit.id for cart item ${item.id ?? 'unknown'}`);
            }
            return {
              inventory_unit_id: unitId,
              quantity: item.quantity ?? 1,
            };
          });

          // Create order
          const previousBase = OpenAPI.BASE;
          OpenAPI.BASE = inventoryBaseUrl;
          const order = await OrdersService.ordersCreate({
            order_items: orderItems,
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            customer_email: formData.customer_email || undefined,
            delivery_address: formData.delivery_address || undefined,
            order_source: 'ONLINE', // Explicitly set for online orders
          } as OrderRequest);
          OpenAPI.BASE = previousBase;

          console.log('Order created:', order);

          // Store order ID and show payment method modal
          setCreatedOrderId(order.order_id ?? null);
          setIsSubmitting(false);
          // Close checkout modal and show payment method modal
          setShowPaymentMethodModal(true);
        } catch (orderError: any) {
          // Handle order creation errors
          console.error('Order creation error:', orderError);
          let errorMessage = 'Failed to create order. ';
          
          if (orderError?.message?.includes('Authentication') || orderError?.message?.includes('logged in')) {
            errorMessage += 'Please sign in, create an account, or continue as guest to proceed.';
          } else {
            errorMessage += orderError?.message || 'Please try again or use "Request Quote" instead.';
          }
          
          setError(errorMessage);
          setIsSubmitting(false);
        }
      } else {
        // Create lead (original flow)
        console.log('Submitting checkout with data:', {
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email || undefined,
          delivery_address: formData.delivery_address || undefined,
        });

        const expiresAt = cart?.expires_at ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const response = await checkout({
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email || undefined,
          delivery_address: formData.delivery_address || undefined,
          expires_at: expiresAt,
        });

        console.log('Checkout response:', response);

        // Show success message instead of redirecting
        // Ensure we have lead_reference from response
        const leadReferenceValue =
          (response as { lead_reference?: string; lead?: { lead_reference?: string } })?.lead_reference ??
          (response as { lead?: { lead_reference?: string } })?.lead?.lead_reference ??
          null;
        if (response && leadReferenceValue) {
          setLeadReference(leadReferenceValue);
          setIsSuccess(true);
          setIsSubmitting(false);
        } else {
          // If no lead_reference, still show success but log warning
          console.warn('Checkout successful but no lead_reference in response:', response);
          setLeadReference(leadReferenceValue);
          setIsSuccess(true);
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      console.error('Error response:', err?.response?.data);
      
      // Extract detailed error message from response
      let errorMessage = 'Failed to checkout. Please try again.';
      
      if (err?.response?.data) {
        const errorData = err.response.data;
        if (errorData.errors) {
          // Validation errors
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => {
              const fieldName = field.replace(/_/g, ' ');
              return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
            });
          errorMessage = errorMessages.join('\n');
        } else if (errorData.error) {
          // Handle "Cart already submitted" error gracefully
          if (errorData.error === 'Cart already submitted' || errorData.error?.includes('already submitted')) {
            errorMessage = 'This cart has already been submitted. Your order is being processed.';
            // Show success state instead of error for already-submitted carts
            setIsSuccess(true);
            setIsSubmitting(false);
            return;
          }
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performCheckout();
  };

  const handleGuestProceed = async () => {
    setAllowGuestCheckout(true);
    setShowAuthGate(false);
    setAuthMode(null);
    setAuthError(null);
    await performCheckout();
  };

  const handleLogin = async () => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const res = await LoginService.loginCreate({
        username_or_email: authForm.username_or_email,
        password: authForm.password,
      });
      const token = (res as { token?: string })?.token;
      if (token) {
        setAuthToken(token);
        setIsAuthenticated(true);
      }
      setShowAuthGate(false);
      setAuthMode(null);
      setAllowGuestCheckout(false);
      await performCheckout();
    } catch (err) {
      setAuthError('Login failed. Please check your credentials.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const res = await RegisterService.registerCreate({
        username: authForm.username,
        email: authForm.email,
        password: authForm.password,
        phone_number: formData.customer_phone || undefined,
        address: formData.delivery_address || undefined,
      });
      const token = (res as { token?: string })?.token;
      if (token) {
        setAuthToken(token);
        setIsAuthenticated(true);
      }
      setShowAuthGate(false);
      setAuthMode(null);
      setAllowGuestCheckout(false);
      await performCheckout();
    } catch (err) {
      setAuthError('Registration failed. Please review details and try again.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Handle payment method selection and proceed
  const handlePaymentProceed = async (paymentMethod: string, mobileNumber?: string) => {
    if (!createdOrderId) {
      setError('Order ID not found. Please try again.');
      return;
    }

    setIsProcessingPayment(true);
    setShowPaymentMethodModal(false);

    try {
      // Initiate payment
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const cancellationUrl = `${window.location.origin}/payment/cancelled`;

      console.log('\n[PESAPAL] ========== CHECKOUT: INITIATE PAYMENT START ==========');
      console.log('[PESAPAL] Order ID:', createdOrderId);
      console.log('[PESAPAL] Payment Method:', paymentMethod);
      console.log('[PESAPAL] Mobile Number:', mobileNumber);
      console.log('[PESAPAL] Callback URL:', callbackUrl);
      console.log('[PESAPAL] Cancellation URL:', cancellationUrl);
      console.log('[PESAPAL] Customer Data:', {
        email: formData.customer_email,
        phone: mobileNumber || formData.customer_phone,
        name: formData.customer_name,
      });

      const previousBase = OpenAPI.BASE;
      OpenAPI.BASE = inventoryBaseUrl;
      const paymentResult = await OrdersService.ordersInitiatePaymentCreate(createdOrderId, {
        callback_url: callbackUrl,
        cancellation_url: cancellationUrl,
        customer: {
          email: formData.customer_email,
          phone_number: mobileNumber || formData.customer_phone,
          first_name: formData.customer_name.split(' ')[0] || formData.customer_name,
          last_name: formData.customer_name.split(' ').slice(1).join(' ') || '',
        },
      } as InitiatePaymentRequestRequest);
      OpenAPI.BASE = previousBase;

      console.log('[PESAPAL] Payment initiation result:', JSON.stringify(paymentResult, null, 2));

      if ((paymentResult as any).success && (paymentResult as any).redirect_url) {
        console.log('[PESAPAL] Payment initiated successfully - redirecting to payment page');
        console.log('[PESAPAL] Redirect URL:', (paymentResult as any).redirect_url);
        // Redirect to Pesapal payment page
        window.location.href = (paymentResult as any).redirect_url;
        console.log('[PESAPAL] ========== CHECKOUT: INITIATE PAYMENT SUCCESS ==========\n');
      } else {
        // Order created but payment failed - show helpful message
        const errorMsg = (paymentResult as any).error || 'Unknown error';
        console.log('[PESAPAL] ========== CHECKOUT: INITIATE PAYMENT FAILED ==========');
        console.log('[PESAPAL] Error:', errorMsg);
        console.log('[PESAPAL] =======================================================\n');
        setError(
          `Order created successfully (Order ID: ${createdOrderId}), but payment initiation failed. ` +
          `Error: ${errorMsg}. ` +
          `Please contact support or try again later.`
        );
        setIsProcessingPayment(false);
      }
    } catch (paymentError: any) {
      // Order created but payment failed - show helpful message
      const paymentErrorMessage = paymentError?.message || paymentError?.data?.error || 'Unknown error';
      console.log('[PESAPAL] ========== CHECKOUT: INITIATE PAYMENT EXCEPTION ==========');
      console.log('[PESAPAL] Exception:', paymentErrorMessage);
      console.log('[PESAPAL] Full Error:', paymentError);
      console.log('[PESAPAL] =========================================================\n');
      setError(
        `Order created successfully (Order ID: ${createdOrderId}), but payment initiation failed. ` +
        `Error: ${paymentErrorMessage}. ` +
        `Please contact support or try again later. You can also try to pay later using order ID: ${createdOrderId}`
      );
      setIsProcessingPayment(false);
    }
  };

  // Success view
  if (isSuccess) {
    return (
      <div className="checkout-modal">
        <div className="checkout-modal__panel checkout-modal__panel--success">
          <button
            type="button"
            onClick={onClose}
            className="checkout-modal__close"
            aria-label="Close checkout"
          >
            <svg className="checkout-modal__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="checkout-modal__section">
            <div className="checkout-modal__logo">
              <Image 
                src="/affordablelogo.png" 
                alt={`${brandConfig.name} logo`}
                width={100}
                height={100}
                className="checkout-modal__logo-image"
                priority
              />
            </div>
            <div className="checkout-modal__icon checkout-modal__icon--success">
              <svg
                className="checkout-modal__icon-svg checkout-modal__icon-svg--success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="checkout-modal__title checkout-modal__title--success">Thank You!</h2>
            <p className="checkout-modal__text">
              {paymentMode === 'pay_now' 
                ? 'Your order has been created successfully.'
                : 'Your inquiry has been submitted successfully.'}
            </p>
            {paymentMode === 'quote' && (
              <p className="checkout-modal__text">
                A salesperson will contact you shortly.
              </p>
            )}
            {leadReference && (
              <p className="checkout-modal__meta">
                Reference: <span className="checkout-modal__meta-value">{leadReference}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => {
              onClose();
              router.push('/products');
            }}
            className="checkout-modal__primary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Don't show checkout form if payment modal is showing
  if (showPaymentMethodModal) {
    return (
      <>
        <div className="checkout-modal__backdrop"></div>
        <PaymentMethodModal
          onClose={() => {
            setShowPaymentMethodModal(false);
            onClose();
          }}
          onProceed={handlePaymentProceed}
          totalAmount={totalValue}
          merchantName="AFFORDABLE GADGETS"
          isLoading={isProcessingPayment}
        />
      </>
    );
  }

  return (
    <div className="checkout-modal">
      <div className="checkout-modal__panel">
        <button
          type="button"
          onClick={onClose}
          className="checkout-modal__close"
          aria-label="Close checkout"
        >
          <svg className="checkout-modal__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="checkout-modal__logo checkout-modal__logo--small">
          <Image 
            src="/affordablegadgetslogo.png" 
            alt={`${brandConfig.name} logo`}
            width={100}
            height={100}
            className="checkout-modal__logo-image"
            priority
          />
        </div>
        <h2 className="checkout-modal__heading">Checkout</h2>
        
        {/* Payment Mode Selection */}
        <div className="checkout-modal__mode">
          <div className="checkout-modal__mode-options">
            <label className="checkout-modal__mode-option">
              <input
                type="radio"
                name="paymentMode"
                value="pay_now"
                checked={paymentMode === 'pay_now'}
                onChange={(e) => setPaymentMode(e.target.value as 'pay_now' | 'quote')}
                className="checkout-modal__radio"
              />
              <span className="checkout-modal__mode-label">Pay Now</span>
            </label>
            <label className="checkout-modal__mode-option">
              <input
                type="radio"
                name="paymentMode"
                value="quote"
                checked={paymentMode === 'quote'}
                onChange={(e) => setPaymentMode(e.target.value as 'pay_now' | 'quote')}
                className="checkout-modal__radio"
              />
              <span className="checkout-modal__mode-label">Request Quote</span>
            </label>
          </div>
          <p className="checkout-modal__mode-text">
            {paymentMode === 'pay_now' 
              ? 'Complete your payment securely with Pesapal (M-Pesa, Cards, etc.)'
              : 'A salesperson will contact you shortly with a quote'}
          </p>
        </div>

        {showAuthGate ? (
          <div className="checkout-modal__auth">
            <p className="checkout-modal__text">
              To continue with payment, sign in or create an account. You can also proceed without an account.
            </p>

            <div className="checkout-modal__auth-actions">
              <button type="button" className="checkout-modal__secondary" onClick={openLogin}>
                Sign in
              </button>
              <button type="button" className="checkout-modal__secondary" onClick={openRegister}>
                Create account
              </button>
            </div>

            <button type="button" className="checkout-modal__primary" onClick={handleGuestProceed} disabled={isAuthSubmitting}>
              Continue as guest
            </button>

            {authMode === 'login' && (
              <div className="checkout-modal__auth-form">
                <input
                  type="text"
                  placeholder="Email or Username"
                  value={authForm.username_or_email}
                  onChange={(e) => setAuthForm({ ...authForm, username_or_email: e.target.value })}
                  className="checkout-modal__input"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="checkout-modal__input"
                />
                <button type="button" className="checkout-modal__primary" onClick={handleLogin} disabled={isAuthSubmitting}>
                  {isAuthSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            )}

            {authMode === 'register' && (
              <div className="checkout-modal__auth-form">
                <input
                  type="text"
                  placeholder="Username"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  className="checkout-modal__input"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="checkout-modal__input"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="checkout-modal__input"
                />
                <button type="button" className="checkout-modal__primary" onClick={handleRegister} disabled={isAuthSubmitting}>
                  {isAuthSubmitting ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            )}

            {authError && <div className="checkout-modal__alert">{authError}</div>}

            <button type="button" className="checkout-modal__link" onClick={handleAuthBack}>
              Back to checkout
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="checkout-modal__form">
          <div className="checkout-modal__field">
            <label htmlFor="name" className="checkout-modal__label">
              Name <span className="checkout-modal__required">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="checkout-modal__input"
            />
          </div>

          <div className="checkout-modal__field">
            <label htmlFor="phone" className="checkout-modal__label">
              Phone <span className="checkout-modal__required">*</span>
              {isRecognizing && (
                <span className="checkout-modal__status">Checking...</span>
              )}
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              className="checkout-modal__input"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="checkout-modal__field">
            <label htmlFor="email" className="checkout-modal__label">
              Email (Optional)
            </label>
            <input
              id="email"
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              className="checkout-modal__input"
            />
          </div>

          <div className="checkout-modal__field">
            <label htmlFor="address" className="checkout-modal__label">
              Delivery Address (Optional)
            </label>
            <textarea
              id="address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              className="checkout-modal__textarea"
              rows={3}
            />
          </div>

          <div className="checkout-modal__summary">
            <div className="checkout-modal__summary-row">
              <span>Total</span>
              <span>{formatPrice(totalValue)}</span>
            </div>
          </div>

          {error && (
            <div className="checkout-modal__alert">
              {error}
            </div>
          )}

          <div className="checkout-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="checkout-modal__secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="checkout-modal__primary"
              disabled={isSubmitting || isCartSubmitted}
            >
              {isSubmitting 
                ? (paymentMode === 'pay_now' ? 'Creating Order...' : 'Processing...')
                : isCartSubmitted 
                  ? 'Already Submitted' 
                  : paymentMode === 'pay_now'
                    ? 'Pay Now'
                    : 'Request Quote'}
            </button>
          </div>
          </form>
        )}
      </div>
    </div>
  );
}


