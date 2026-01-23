'use client';

import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/format';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { CheckoutModal } from './CheckoutModal';

export function CartPage() {
  const { cart, isLoading, removeFromCart, totalValue, itemCount, updateCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [removingBundleGroup, setRemovingBundleGroup] = useState<string | null>(null);

  // Periodically check if cart still exists (in case it was cleared after payment)
  useEffect(() => {
    if (!cart || !cart.is_submitted) return;

    // Check every 5 seconds if cart is submitted (waiting for payment confirmation)
    const interval = setInterval(() => {
      updateCart();
    }, 5000);

    return () => clearInterval(interval);
  }, [cart, updateCart]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
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
                <div key={group.key} className="bg-white rounded-lg shadow-sm border-2 border-orange-100">
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
                      return (
                        <div key={item.id} className="flex gap-4 border border-gray-100 rounded-lg p-3">
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
              return (
                <div
                  key={item.id}
                  className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border-2 border-gray-100"
                >
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
              );
            });
          })}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
            <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Items ({itemCount})</span>
                <span>{formatPrice(totalValue)}</span>
              </div>
            </div>
            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatPrice(totalValue)}</span>
              </div>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              disabled={cart.is_submitted}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                cart.is_submitted
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {cart.is_submitted ? 'Already Submitted' : 'Checkout'}
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

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          totalValue={totalValue}
        />
      )}
    </div>
  );
}

