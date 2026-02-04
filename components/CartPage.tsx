'use client';

import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/format';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { OpenAPI, OrdersService, ApiService } from '@/lib/api/generated';
import { inventoryBaseUrl, apiBaseUrl } from '@/lib/api/openapi';
import { brandConfig } from '@/lib/config/brand';

export function CartPage() {
  const { cart, isLoading, removeFromCart, totalValue, itemCount, updateCart } = useCart();
  const [removingBundleGroup, setRemovingBundleGroup] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryRates, setDeliveryRates] = useState<Array<{ county: string; ward?: string | null; price: number }>>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_county: '',
    delivery_ward: '',
    delivery_date: '',
    delivery_time_start: '',
    delivery_time_end: '',
    delivery_notes: '',
  });
  const deliveryStorageKey = 'affordable_gadgets_delivery_details';
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryDetailsSaved, setDeliveryDetailsSaved] = useState(false);
  const [pendingCartSync, setPendingCartSync] = useState(false);
  const [ordersPhone, setOrdersPhone] = useState('');
  const [ordersOtp, setOrdersOtp] = useState('');
  const [ordersOtpSent, setOrdersOtpSent] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // Periodically check if cart still exists (in case it was cleared after payment)
  useEffect(() => {
    if (!cart || !cart.is_submitted) return;

    // Check every 5 seconds if cart is submitted (waiting for payment confirmation)
    const interval = setInterval(() => {
      updateCart();
    }, 5000);

    return () => clearInterval(interval);
  }, [cart, updateCart]);

  useEffect(() => {
    const fetchDeliveryRates = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/public/delivery-rates/`, {
          headers: {
            'X-Brand-Code': brandConfig.code,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load delivery rates');
        }
        const data = await response.json();
        const rates = Array.isArray(data) ? data : data?.results || [];
        setDeliveryRates(rates);
      } catch (err: any) {
        console.error('Failed to fetch delivery rates:', err);
      }
    };

    fetchDeliveryRates();
  }, []);

  const items = cart?.items ?? [];
  const groupedItems = useMemo(() => {
    const groups: Array<{ key: string; isBundle: boolean; items: typeof items }> = [];
    const groupMap = new Map<string, typeof items>();
    items.forEach((item) => {
      const groupId = item.bundle_group_id ? String(item.bundle_group_id) : null;
      const key = groupId ? `bundle-${groupId}` : `item-${item.id}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(item);
    });
    groupMap.forEach((groupItems, key) => {
      groups.push({
        key,
        isBundle: key.startsWith('bundle-'),
        items: groupItems,
      });
    });
    return groups;
  }, [items]);

  const counties = useMemo(() => {
    const unique = new Set(
      deliveryRates.map((rate) => (rate.county || '').trim()).filter(Boolean)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [deliveryRates]);

  const wards = useMemo(() => {
    const county = formData.delivery_county.trim().toLowerCase();
    if (!county) return [];
    return deliveryRates
      .filter((rate) => (rate.county || '').trim().toLowerCase() === county && rate.ward)
      .map((rate) => String(rate.ward))
      .sort((a, b) => a.localeCompare(b));
  }, [deliveryRates, formData.delivery_county]);

  const isWardRequiredForCounty = (county: string) =>
    ['nairobi', 'kiambu'].includes(county.trim().toLowerCase());
  const isWardRequired = isWardRequiredForCounty(formData.delivery_county);

  const isDeliveryDetailsComplete = (data = formData) => {
    const hasName = data.customer_name.trim().length > 0;
    const hasPhone = data.customer_phone.trim().length > 0;
    const hasCounty = data.delivery_county.trim().length > 0;
    const wardRequired = isWardRequiredForCounty(data.delivery_county);
    const hasWard = !wardRequired || data.delivery_ward.trim().length > 0;
    return hasName && hasPhone && hasCounty && hasWard;
  };

  const buildDeliveryAddress = (data = formData) => {
    const county = data.delivery_county.trim();
    const ward = data.delivery_ward.trim();
    return [county, ward].filter(Boolean).join(', ');
  };

  const buildCartDeliveryPayload = () => ({
    customer_name: formData.customer_name.trim(),
    customer_phone: formData.customer_phone.trim(),
    customer_email: formData.customer_email.trim() || null,
    delivery_address: buildDeliveryAddress() || null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(deliveryStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
        setDeliveryDetailsSaved(isDeliveryDetailsComplete(parsed));
      }
    } catch (err) {
      console.warn('Failed to load delivery details:', err);
    }
  }, []);

  useEffect(() => {
    if (!cart) return;
    setFormData((prev) => ({
      ...prev,
      customer_name: prev.customer_name || cart.customer_name || '',
      customer_phone: prev.customer_phone || cart.customer_phone || '',
      customer_email: prev.customer_email || cart.customer_email || '',
      delivery_address: prev.delivery_address || cart.delivery_address || '',
    }));
  }, [cart]);

  useEffect(() => {
    if (!deliveryDetailsSaved) {
      setIsDeliveryModalOpen(true);
    }
  }, [deliveryDetailsSaved]);

  useEffect(() => {
    if (!pendingCartSync || !cart?.id || !deliveryDetailsSaved) return;
    const syncDeliveryDetails = async () => {
      try {
        await ApiService.apiV1PublicCartPartialUpdate(cart.id as number, buildCartDeliveryPayload());
        await updateCart();
        setPendingCartSync(false);
      } catch (err) {
        console.error('Failed to sync delivery details to cart:', err);
      }
    };
    syncDeliveryDetails();
  }, [pendingCartSync, cart?.id, deliveryDetailsSaved, formData, updateCart]);

  const deliveryFee = useMemo(() => {
    const county = formData.delivery_county.trim().toLowerCase();
    const ward = formData.delivery_ward.trim().toLowerCase();
    if (!county) return 0;
    if (ward) {
      const wardRate = deliveryRates.find(
        (rate) =>
          (rate.county || '').trim().toLowerCase() === county &&
          (rate.ward || '').trim().toLowerCase() === ward
      );
      if (wardRate) return Number(wardRate.price || 0);
    }
    const countyRate = deliveryRates.find(
      (rate) =>
        (rate.county || '').trim().toLowerCase() === county &&
        (!rate.ward || String(rate.ward).trim() === '')
    );
    return countyRate ? Number(countyRate.price || 0) : 0;
  }, [deliveryRates, formData.delivery_county, formData.delivery_ward]);

  const totalWithDelivery = Number(totalValue || 0) + deliveryFee;

  const buildDeliveryDateTime = (date: string, time: string) => {
    if (!date || !time) return undefined;
    const isoString = new Date(`${date}T${time}:00`).toISOString();
    return isoString;
  };

  const handleSaveDeliveryDetails = async () => {
    if (!isDeliveryDetailsComplete()) {
      setError('Name, phone, county and ward (if required) are needed.');
      return;
    }

    setError(null);
    const computedAddress = buildDeliveryAddress();
    const updatedFormData = {
      ...formData,
      delivery_address: computedAddress,
    };
    setFormData(updatedFormData);
    const payload = {
      customer_name: updatedFormData.customer_name,
      customer_phone: updatedFormData.customer_phone,
      customer_email: updatedFormData.customer_email,
      delivery_address: updatedFormData.delivery_address,
      delivery_county: updatedFormData.delivery_county,
      delivery_ward: updatedFormData.delivery_ward,
      delivery_date: updatedFormData.delivery_date,
      delivery_time_start: updatedFormData.delivery_time_start,
      delivery_time_end: updatedFormData.delivery_time_end,
      delivery_notes: updatedFormData.delivery_notes,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(deliveryStorageKey, JSON.stringify(payload));
    }

    if (cart?.id) {
      try {
        await ApiService.apiV1PublicCartPartialUpdate(cart.id as number, buildCartDeliveryPayload());
        await updateCart();
      } catch (err) {
        console.error('Failed to save delivery details:', err);
        setError('Failed to save delivery details. Please try again.');
        return;
      }
    } else {
      setPendingCartSync(true);
    }

    setDeliveryDetailsSaved(true);
    setIsDeliveryModalOpen(false);
  };

  const handleCheckout = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      setError('Cart is empty');
      return;
    }
    if (!deliveryDetailsSaved) {
      setError('Please save delivery details before proceeding.');
      setIsDeliveryModalOpen(true);
      return;
    }
    if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
      setError('Name and phone are required');
      return;
    }
    if (!formData.delivery_county.trim()) {
      setError('Please select a delivery county');
      return;
    }
    if (isWardRequired && !formData.delivery_ward.trim()) {
      setError('Please select a delivery ward');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const orderItems = cart.items.map((item) => {
        const unitId = item.inventory_unit?.id;
        if (!unitId) {
          throw new Error(`Missing inventory_unit.id for cart item ${item.id ?? 'unknown'}`);
        }
        return {
          inventory_unit_id: unitId,
          quantity: item.quantity ?? 1,
        };
      });

      const deliveryWindowStart = buildDeliveryDateTime(
        formData.delivery_date,
        formData.delivery_time_start
      );
      const deliveryWindowEnd = buildDeliveryDateTime(
        formData.delivery_date,
        formData.delivery_time_end
      );

      const previousBase = OpenAPI.BASE;
      OpenAPI.BASE = inventoryBaseUrl;
      const orderPayload = {
        order_items: orderItems,
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        customer_email: formData.customer_email.trim() || undefined,
        delivery_address: formData.delivery_address.trim() || undefined,
        delivery_county: formData.delivery_county.trim(),
        delivery_ward: formData.delivery_ward.trim() || undefined,
        delivery_window_start: deliveryWindowStart,
        delivery_window_end: deliveryWindowEnd,
        delivery_notes: formData.delivery_notes.trim() || undefined,
        order_source: 'ONLINE',
      } as any;
      const order = await OrdersService.ordersCreate(orderPayload);

      const callbackUrl = `${window.location.origin}/payment/callback`;
      const cancellationUrl = `${window.location.origin}/payment/cancelled`;
      const paymentResult = await OrdersService.ordersInitiatePaymentCreate(order.order_id ?? '', {
        callback_url: callbackUrl,
        cancellation_url: cancellationUrl,
        customer: {
          email: formData.customer_email.trim() || undefined,
          phone_number: formData.customer_phone.trim(),
          first_name: formData.customer_name.trim().split(' ')[0] || formData.customer_name.trim(),
          last_name: formData.customer_name.trim().split(' ').slice(1).join(' ') || '',
        },
      });
      OpenAPI.BASE = previousBase;

      if ((paymentResult as any)?.redirect_url) {
        window.location.href = (paymentResult as any).redirect_url;
        return;
      }

      setError('Payment initiation failed. Please try again.');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err?.message || 'Failed to checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendOrdersOtp = async () => {
    if (!ordersPhone.trim()) {
      setError('Enter your phone number to receive an OTP');
      return;
    }
    setOrdersLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/public/orders/otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brand-Code': brandConfig.code,
        },
        body: JSON.stringify({ phone: ordersPhone.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.sent) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      setOrdersOtpSent(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    if (!ordersPhone.trim() || !ordersOtp.trim()) {
      setError('Enter your phone and OTP');
      return;
    }
    setOrdersLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/public/orders/history/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brand-Code': brandConfig.code,
        },
        body: JSON.stringify({ phone: ordersPhone.trim(), otp: ordersOtp.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load orders');
      }
      setOrderHistory(Array.isArray(data.orders) ? data.orders : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const getReceiptUrl = (orderId: string) => {
    let apiUrl = brandConfig.apiBaseUrl || apiBaseUrl;
    if (!apiUrl || apiUrl.trim() === '' || (apiUrl.startsWith('/') && !apiUrl.startsWith('http'))) {
      apiUrl = apiBaseUrl;
    }
    apiUrl = apiUrl.replace(/\/+$/, '');
    if (apiUrl.startsWith('//')) {
      apiUrl = 'https:' + apiUrl;
    }
    return `${apiUrl}/api/inventory/orders/${orderId}/receipt/?format=pdf`;
  };

  const deliveryDateLabel = formData.delivery_date
    ? new Date(formData.delivery_date).toLocaleDateString('en-GB', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : 'Not selected';

  const openDeliveryModal = () => {
    setIsDeliveryModalOpen(true);
  };

  if (isLoading) {
    return <div className="cart-page__loading">Loading cart...</div>;
  }

  return (
    <div className="cart-page">
      <h1 className="section-label cart-page__title">Shopping Cart</h1>
      {error && (
        <div className="cart-page__alert cart-page__alert--error">
          {error}
        </div>
      )}

      <div className="cart-page__layout">
        {/* Cart Items */}
        <div className="cart-page__items">
          {items.length === 0 ? (
            <div className="cart-page__empty">
              <h2 className="cart-page__empty-title">Your Cart is Empty</h2>
              <p className="cart-page__empty-copy">Add some products to get started!</p>
              <Link
                href="/products"
                className="cart-page__empty-action"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            groupedItems.map((group) => {
            const groupTotal = group.items.reduce((sum, item) => {
              const basePrice = Number(item.inventory_unit?.selling_price ?? 0);
              const unitPrice = Number(item.unit_price ?? basePrice);
              const quantity = Number(item.quantity ?? 0);
              return sum + unitPrice * quantity;
            }, 0);

            if (group.isBundle) {
              const groupId = group.key.replace('bundle-', '');
              return (
                  <div key={group.key} className="cart-page__bundle">
                  <div className="cart-page__bundle-header">
                    <div>
                      <p className="cart-page__bundle-label">Bundle deal</p>
                      <p className="cart-page__bundle-meta">Group {groupId.slice(0, 8)}</p>
                    </div>
                    <div className="cart-page__bundle-total">
                      <p className="cart-page__bundle-total-label">Bundle total</p>
                      <p className="cart-page__bundle-total-amount">{formatPrice(groupTotal)}</p>
                    </div>
                  </div>
                  <div className="cart-page__bundle-items">
                    {group.items.map((item) => {
                      const inventoryUnit = item.inventory_unit;
                      const basePrice = Number(inventoryUnit?.selling_price ?? 0);
                      const unitPrice = Number(item.unit_price ?? basePrice);
                      const originalPrice = basePrice;
                      const hasPromotion = item.unit_price !== undefined && item.unit_price !== null && unitPrice < originalPrice;
                      const quantity = Number(item.quantity ?? 0);
                        const imageUrl =
                          inventoryUnit?.images?.[0]?.thumbnail_url ||
                          inventoryUnit?.images?.[0]?.image_url ||
                          '/affordablelogo.png';
                      return (
                          <div key={item.id} className="cart-page__bundle-item">
                            <div className="cart-page__bundle-item-media">
                              <Image
                                src={imageUrl}
                                alt={inventoryUnit?.product_name ?? 'Product'}
                                width={96}
                                height={96}
                                className="cart-page__bundle-item-image"
                              />
                            </div>
                          <div className="cart-page__bundle-item-body">
                            <h3 className="cart-page__bundle-item-title">{inventoryUnit?.product_name ?? 'Product'}</h3>
                            <p className="cart-page__bundle-item-meta">
                              {inventoryUnit?.condition ?? 'Condition N/A'}
                              {inventoryUnit?.grade && ` • Grade ${inventoryUnit.grade}`}
                              {inventoryUnit?.storage_gb && ` • ${inventoryUnit.storage_gb}GB`}
                              {inventoryUnit?.ram_gb && ` • ${inventoryUnit.ram_gb}GB RAM`}
                              {inventoryUnit?.color_name && ` • ${inventoryUnit.color_name}`}
                            </p>
                            {hasPromotion ? (
                              <div className="cart-page__bundle-item-prices">
                                <p className="cart-page__bundle-item-price">
                                  {formatPrice(unitPrice)} × {quantity}
                                </p>
                                <p className="cart-page__bundle-item-price-old">
                                  {formatPrice(originalPrice)} × {quantity}
                                </p>
                              </div>
                            ) : (
                              <p className="cart-page__bundle-item-price">
                                {formatPrice(unitPrice)} × {quantity}
                              </p>
                            )}
                          </div>
                          <div className="cart-page__bundle-item-total">
                            <p>
                              {formatPrice(unitPrice * quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    <div className="cart-page__bundle-delivery">
                      <div className="cart-page__bundle-delivery-row">
                        <span>Delivery date: {deliveryDateLabel}</span>
                        <button
                          onClick={openDeliveryModal}
                          className="cart-page__link"
                        >
                          Choose delivery
                        </button>
                      </div>
                    </div>
                  <div className="cart-page__bundle-actions">
                    <button
                      onClick={async () => {
                        setRemovingBundleGroup(group.key);
                        try {
                          const removals = group.items
                            .filter((item) => item.id !== undefined && item.id !== null)
                            .map((item) => removeFromCart(item.id as number));
                          await Promise.all(removals);
                        } finally {
                          setRemovingBundleGroup(null);
                        }
                      }}
                      disabled={removingBundleGroup === group.key}
                      className="cart-page__danger-link"
                    >
                      {removingBundleGroup === group.key ? 'Removing bundle...' : 'Remove bundle'}
                    </button>
                  </div>
                </div>
              );
            }

            return group.items.map((item) => {
              const inventoryUnit = item.inventory_unit;
              const basePrice = Number(inventoryUnit?.selling_price ?? 0);
              const unitPrice = Number(item.unit_price ?? basePrice);
              const originalPrice = basePrice;
              const hasPromotion = item.unit_price !== undefined && item.unit_price !== null && unitPrice < originalPrice;
              const quantity = Number(item.quantity ?? 0);
                const imageUrl =
                  inventoryUnit?.images?.[0]?.thumbnail_url ||
                  inventoryUnit?.images?.[0]?.image_url ||
                  '/affordablelogo.png';
              return (
                <div
                  key={item.id}
                    className="cart-page__item"
                  >
                    <div className="cart-page__item-row">
                      <div className="cart-page__item-media">
                        <Image
                          src={imageUrl}
                          alt={inventoryUnit?.product_name ?? 'Product'}
                          width={96}
                          height={96}
                          className="cart-page__item-image"
                        />
                      </div>
                  <div className="cart-page__item-body">
                    <h3 className="cart-page__item-title">{inventoryUnit?.product_name ?? 'Product'}</h3>
                    <p className="cart-page__item-meta">
                      {inventoryUnit?.condition ?? 'Condition N/A'}
                      {inventoryUnit?.grade && ` • Grade ${inventoryUnit.grade}`}
                      {inventoryUnit?.storage_gb && ` • ${inventoryUnit.storage_gb}GB`}
                      {inventoryUnit?.ram_gb && ` • ${inventoryUnit.ram_gb}GB RAM`}
                      {inventoryUnit?.color_name && ` • ${inventoryUnit.color_name}`}
                    </p>
                    {hasPromotion ? (
                      <div className="cart-page__item-prices">
                        <p className="cart-page__item-price cart-page__item-price--promo">
                          {formatPrice(unitPrice)} × {quantity}
                        </p>
                        <p className="cart-page__item-price-old">
                          {formatPrice(originalPrice)} × {quantity}
                        </p>
                      </div>
                    ) : (
                      <p className="cart-page__item-price">
                        {formatPrice(unitPrice)} × {quantity}
                      </p>
                    )}
                  </div>
                  <div className="cart-page__item-total">
                    {hasPromotion ? (
                      <div className="cart-page__item-total-values">
                        <p className="cart-page__item-total-current cart-page__item-total-current--promo">
                          {formatPrice(unitPrice * quantity)}
                        </p>
                        <p className="cart-page__item-total-old">
                          {formatPrice(originalPrice * quantity)}
                        </p>
                      </div>
                    ) : (
                      <p className="cart-page__item-total-current">
                        {formatPrice(unitPrice * quantity)}
                      </p>
                    )}
                    <button
                      onClick={async () => {
                        if (item.id === undefined || item.id === null) {
                          console.warn('Cannot remove cart item without id');
                          return;
                        }
                        try {
                          await removeFromCart(item.id);
                        } catch (err) {
                          console.error('Failed to remove item:', err);
                        }
                      }}
                      className="cart-page__danger-link cart-page__item-remove"
                    >
                      Remove
                        </button>
                      </div>
                    </div>
                    <div className="cart-page__item-delivery">
                      <span>Delivery date: {deliveryDateLabel}</span>
                      <button
                        onClick={openDeliveryModal}
                        className="cart-page__link"
                      >
                        Choose delivery
                    </button>
                  </div>
                </div>
              );
            });
            })
          )}

          {items.length === 0 && (
            <div className="cart-page__orders">
              <h2 className="cart-page__orders-title">Your Orders</h2>
              <p className="cart-page__orders-copy">
                Verify your phone number to see past orders and download receipts.
              </p>
              <div className="cart-page__orders-form">
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={ordersPhone}
                  onChange={(e) => setOrdersPhone(e.target.value)}
                  className="cart-page__input"
                />
                <div className="cart-page__orders-actions">
                  <button
                    onClick={sendOrdersOtp}
                    disabled={ordersLoading}
                    className="cart-page__btn cart-page__btn--dark"
                  >
                    {ordersOtpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={ordersOtp}
                    onChange={(e) => setOrdersOtp(e.target.value)}
                    className="cart-page__input cart-page__input--stretch"
                  />
                  <button
                    onClick={fetchOrderHistory}
                    disabled={ordersLoading}
                    className="cart-page__btn cart-page__btn--primary"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {orderHistory.length > 0 && (
                <div className="cart-page__orders-list">
                  {orderHistory.map((order) => (
                    <div key={order.order_id} className="cart-page__order-card">
                      <div className="cart-page__order-meta">
                        <div>
                          <p className="cart-page__order-label">Order ID</p>
                          <p className="cart-page__order-value cart-page__order-value--mono">{order.order_id}</p>
                        </div>
                        <div>
                          <p className="cart-page__order-label">Status</p>
                          <p className="cart-page__order-value">{order.status}</p>
                        </div>
                        <div>
                          <p className="cart-page__order-label">Total</p>
                          <p className="cart-page__order-value">{formatPrice(Number(order.total_amount || 0))}</p>
                        </div>
                      </div>
                      <div className="cart-page__order-actions">
                        <Link
                          href={`/orders/${order.order_id}`}
                          className="cart-page__link cart-page__order-link"
                        >
                          View order
                        </Link>
                        <button
                          onClick={() => window.open(getReceiptUrl(order.order_id), '_blank')}
                          className="cart-page__link cart-page__order-link"
                        >
                          Download receipt
                        </button>
                        <Link
                          href="/reviews/eligible"
                          className="cart-page__link cart-page__order-link"
                        >
                          Leave review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Checkout & Summary */}
        <div className="cart-page__sidebar">
          <div className="cart-page__summary-card">
            <h2 className="cart-page__summary-title">Payment Summary</h2>
            <div className="cart-page__summary-items">
              <div className="cart-page__summary-row">
                <span>Items ({itemCount})</span>
                <span>{formatPrice(totalValue)}</span>
              </div>
              <div className="cart-page__summary-row">
                <span>Shipping &amp; handling</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
            </div>
            <div className="cart-page__summary-total">
              <div className="cart-page__summary-total-row">
                <span>Order total</span>
                <span>{formatPrice(totalWithDelivery)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart?.is_submitted || isSubmitting}
              className={`cart-page__checkout-button ${
                cart?.is_submitted || isSubmitting ? 'cart-page__checkout-button--disabled' : ''
              }`}
            >
              {isSubmitting ? 'Redirecting to payment...' : cart?.is_submitted ? 'Already Submitted' : 'Proceed to Payment'}
            </button>
            <Link
              href="/products"
              className="cart-page__summary-link"
            >
              Continue Shopping
            </Link>
          </div>
          <div className="cart-page__delivery-card">
            <div className="cart-page__delivery-header">
              <div>
                <h2 className="cart-page__delivery-title">Delivery Details</h2>
                <p className="cart-page__delivery-copy">
                  {deliveryDetailsSaved
                    ? 'Your saved delivery details are below.'
                    : 'No delivery details saved yet.'}
                </p>
              </div>
              <button
                onClick={openDeliveryModal}
                className="cart-page__delivery-action"
              >
                {deliveryDetailsSaved ? 'Update' : 'Add'}
              </button>
            </div>
            <div className="cart-page__delivery-details">
              <div>
                <span className="cart-page__delivery-label">Name:</span>{' '}
                {formData.customer_name || 'Not set'}
              </div>
              <div>
                <span className="cart-page__delivery-label">Phone:</span>{' '}
                {formData.customer_phone || 'Not set'}
              </div>
              <div>
                <span className="cart-page__delivery-label">Email:</span>{' '}
                {formData.customer_email || 'Not set'}
              </div>
              <div>
                <span className="cart-page__delivery-label">Address:</span>{' '}
                {formData.delivery_address || 'Not set'}
              </div>
              <div>
                <span className="cart-page__delivery-label">County:</span>{' '}
                {formData.delivery_county || 'Not set'}
              </div>
              <div>
                <span className="cart-page__delivery-label">Ward:</span>{' '}
                {formData.delivery_ward || 'Not set'}
              </div>
              <div>
                <span className="cart-page__delivery-label">Delivery date:</span> {deliveryDateLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDeliveryModalOpen && (
        <div className="cart-page__modal">
          <div className="cart-page__modal-card">
            <div className="cart-page__modal-header">
              <div>
                <h2 className="cart-page__modal-title">Delivery Details</h2>
                <p className="cart-page__modal-copy">
                  Please provide delivery details to continue.
                </p>
              </div>
              {deliveryDetailsSaved && (
                <button
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="cart-page__modal-close"
                >
                  Close
                </button>
              )}
            </div>

            <div className="cart-page__modal-form">
              <input
                type="text"
                placeholder="Full name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="cart-page__input"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="cart-page__input"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="cart-page__input"
              />
              <select
                value={formData.delivery_county}
                onChange={(e) => setFormData({ ...formData, delivery_county: e.target.value, delivery_ward: '' })}
                className="cart-page__input"
              >
                <option value="">Select county</option>
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
              {isWardRequired && (
                <select
                  value={formData.delivery_ward}
                  onChange={(e) => setFormData({ ...formData, delivery_ward: e.target.value })}
                  className="cart-page__input"
                >
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
              )}
              <div className="cart-page__modal-grid">
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="cart-page__input"
                />
                <input
                  type="time"
                  value={formData.delivery_time_start}
                  onChange={(e) => setFormData({ ...formData, delivery_time_start: e.target.value })}
                  className="cart-page__input"
                />
              </div>
              <input
                type="time"
                value={formData.delivery_time_end}
                onChange={(e) => setFormData({ ...formData, delivery_time_end: e.target.value })}
                className="cart-page__input"
                placeholder="Delivery end time"
              />
              <textarea
                placeholder="Delivery notes (optional)"
                value={formData.delivery_notes}
                onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                className="cart-page__input cart-page__input--textarea"
                rows={2}
              />
            </div>

            <div className="cart-page__modal-actions">
              <button
                onClick={handleSaveDeliveryDetails}
                className="cart-page__btn cart-page__btn--primary"
              >
                Save details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

