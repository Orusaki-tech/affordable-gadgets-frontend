'use client';

import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/format';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { OpenAPI, OrdersService } from '@/lib/api/generated';
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

  if (isLoading) {
    return <div className="text-center py-12">Loading cart...</div>;
  }

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

  const isWardRequired = ['nairobi', 'kiambu'].includes(formData.delivery_county.trim().toLowerCase());

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

  const handleCheckout = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      setError('Cart is empty');
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

  const scrollToDeliveryDetails = () => {
    const section = document.getElementById('delivery-details');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!cart || items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-6">Add some products to get started!</p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-5">
          {groupedItems.map((group) => {
            const groupTotal = group.items.reduce((sum, item) => {
              const basePrice = Number(item.inventory_unit?.selling_price ?? 0);
              const unitPrice = Number(item.unit_price ?? basePrice);
              const quantity = Number(item.quantity ?? 0);
              return sum + unitPrice * quantity;
            }, 0);

            if (group.isBundle) {
              const groupId = group.key.replace('bundle-', '');
              return (
                <div key={group.key} className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100">
                    <div>
                      <p className="text-sm font-bold text-orange-700">Bundle deal</p>
                      <p className="text-xs text-gray-500">Group {groupId.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Bundle total</p>
                      <p className="text-lg font-bold text-orange-700">{formatPrice(groupTotal)}</p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
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
                        <div key={item.id} className="flex gap-4 border border-gray-100 rounded-xl p-3">
                          <div className="h-24 w-24 flex-shrink-0 rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                            <Image
                              src={imageUrl}
                              alt={inventoryUnit?.product_name ?? 'Product'}
                              width={96}
                              height={96}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{inventoryUnit?.product_name ?? 'Product'}</h3>
                            <p className="text-gray-600 text-xs">
                              {inventoryUnit?.condition ?? 'Condition N/A'}
                              {inventoryUnit?.grade && ` • Grade ${inventoryUnit.grade}`}
                              {inventoryUnit?.storage_gb && ` • ${inventoryUnit.storage_gb}GB`}
                              {inventoryUnit?.ram_gb && ` • ${inventoryUnit.ram_gb}GB RAM`}
                              {inventoryUnit?.color_name && ` • ${inventoryUnit.color_name}`}
                            </p>
                            {hasPromotion ? (
                              <div className="mt-2">
                                <p className="text-sm font-semibold text-red-600">
                                  {formatPrice(unitPrice)} × {quantity}
                                </p>
                                <p className="text-xs text-gray-400 line-through">
                                  {formatPrice(originalPrice)} × {quantity}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm font-semibold mt-2">
                                {formatPrice(unitPrice)} × {quantity}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <p className="text-base font-bold">
                              {formatPrice(unitPrice * quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 pb-4 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Delivery date: {deliveryDateLabel}</span>
                      <button
                        onClick={scrollToDeliveryDetails}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Choose delivery
                      </button>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
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
                      className="text-red-600 hover:text-red-700 text-sm hover:underline"
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
                  className="flex flex-col gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
                >
                  <div className="flex gap-4">
                    <div className="h-24 w-24 flex-shrink-0 rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                      <Image
                        src={imageUrl}
                        alt={inventoryUnit?.product_name ?? 'Product'}
                        width={96}
                        height={96}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{inventoryUnit?.product_name ?? 'Product'}</h3>
                    <p className="text-gray-600 text-sm">
                      {inventoryUnit?.condition ?? 'Condition N/A'}
                      {inventoryUnit?.grade && ` • Grade ${inventoryUnit.grade}`}
                      {inventoryUnit?.storage_gb && ` • ${inventoryUnit.storage_gb}GB`}
                      {inventoryUnit?.ram_gb && ` • ${inventoryUnit.ram_gb}GB RAM`}
                      {inventoryUnit?.color_name && ` • ${inventoryUnit.color_name}`}
                    </p>
                    {hasPromotion ? (
                      <div className="mt-2">
                        <p className="text-lg font-semibold text-red-600">
                          {formatPrice(unitPrice)} × {quantity}
                        </p>
                        <p className="text-sm text-gray-400 line-through">
                          {formatPrice(originalPrice)} × {quantity}
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold mt-2">
                        {formatPrice(unitPrice)} × {quantity}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    {hasPromotion ? (
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-600">
                          {formatPrice(unitPrice * quantity)}
                        </p>
                        <p className="text-sm text-gray-400 line-through">
                          {formatPrice(originalPrice * quantity)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold">
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
                      className="text-red-600 hover:text-red-700 text-sm hover:underline mt-2"
                    >
                      Remove
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
                    <span>Delivery date: {deliveryDateLabel}</span>
                    <button
                      onClick={scrollToDeliveryDetails}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Choose delivery
                    </button>
                  </div>
                </div>
              );
            });
          })}
        </div>

        {/* Checkout & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div id="delivery-details" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Delivery Details</h2>
              <p className="text-sm text-gray-600">
                Provide delivery details to calculate the final total.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Delivery address"
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
              <select
                value={formData.delivery_county}
                onChange={(e) => setFormData({ ...formData, delivery_county: e.target.value, delivery_ward: '' })}
                className="w-full px-3 py-2 border rounded-lg"
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
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
              )}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="time"
                  value={formData.delivery_time_start}
                  onChange={(e) => setFormData({ ...formData, delivery_time_start: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <input
                type="time"
                value={formData.delivery_time_end}
                onChange={(e) => setFormData({ ...formData, delivery_time_end: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Delivery end time"
              />
              <textarea
                placeholder="Delivery notes (optional)"
                value={formData.delivery_notes}
                onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-4">Payment Summary</h2>
            <div className="space-y-2 mb-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Items ({itemCount})</span>
                <span>{formatPrice(totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping &amp; handling</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
            </div>
            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Order total</span>
                <span>{formatPrice(totalWithDelivery)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.is_submitted || isSubmitting}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                cart.is_submitted || isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSubmitting ? 'Redirecting to payment...' : cart.is_submitted ? 'Already Submitted' : 'Proceed to Payment'}
            </button>
            <Link
              href="/products"
              className="block text-center mt-4 text-blue-600 hover:text-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Order history section */}
      <div className="mt-10 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-2">Your Orders</h2>
        <p className="text-sm text-gray-600 mb-4">
          Verify your phone number to see past orders and download receipts.
        </p>
        <div className="flex flex-col gap-3 max-w-xl">
          <input
            type="tel"
            placeholder="Phone number"
            value={ordersPhone}
            onChange={(e) => setOrdersPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={sendOrdersOtp}
              disabled={ordersLoading}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg"
            >
              {ordersOtpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
            <input
              type="text"
              placeholder="Enter OTP"
              value={ordersOtp}
              onChange={(e) => setOrdersOtp(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={fetchOrderHistory}
              disabled={ordersLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Verify
            </button>
          </div>
        </div>

        {orderHistory.length > 0 && (
          <div className="mt-6 space-y-4">
            {orderHistory.map((order) => (
              <div key={order.order_id} className="border rounded-lg p-4 flex flex-col gap-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-mono text-sm">{order.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold">{order.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-semibold">{formatPrice(Number(order.total_amount || 0))}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/orders/${order.order_id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View order
                  </Link>
                  <button
                    onClick={() => window.open(getReceiptUrl(order.order_id), '_blank')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Download receipt
                  </button>
                  <Link
                    href="/reviews/eligible"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Leave review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

