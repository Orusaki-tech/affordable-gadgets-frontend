/**
 * Cart Context and Hook
 */
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { ApiService, Cart, CartItemRequest, CartRequest } from '@/lib/api/generated';
import { getApiErrorInfo } from '@/lib/utils/apiError';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (
    inventoryUnitId: number,
    quantity?: number,
    promotionId?: number,
    unitPrice?: number
  ) => Promise<void>;
  addBundleToCart: (
    bundleId: number,
    mainInventoryUnitId?: number,
    bundleItemIds?: number[]
  ) => Promise<void>;
  updateCartPhone: (phone: string) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateCart: () => Promise<void>;
  /** Awaitable cart reload after login/register — use before checkout. */
  reloadCart: () => Promise<Cart | null>;
  checkout: (checkoutData: CartRequest) => Promise<Cart>;
  clearCart: () => void;
  itemCount: number;
  totalValue: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getCartId = (currentCart: Cart): number => {
  if (currentCart.id === undefined) {
    throw new Error('Cart ID is missing');
  }
  return currentCart.id;
};

type CartItemCreateRequest = CartItemRequest & {
  promotion_id?: number;
  unit_price?: number;
};

type BundleAddRequest = {
  bundle_id: number;
  main_inventory_unit_id?: number;
  bundle_item_ids?: number[];
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Always-current cart for async flows (avoids stale closure after create/add). */
  const cartRef = useRef<Cart | null>(null);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const refreshCartById = useCallback(async (cartId: number): Promise<Cart | null> => {
    try {
      const updatedCart = await ApiService.apiV1PublicCartRetrieve(cartId);
      setCart(updatedCart);
      cartRef.current = updatedCart;
      return updatedCart;
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.status === 404) {
        setCart(null);
        cartRef.current = null;
        return null;
      }
      throw err;
    }
  }, []);

  const ensureCart = useCallback(async (): Promise<Cart> => {
    const existing = cartRef.current;
    if (existing?.id != null) return existing;
    const created = await ApiService.apiV1PublicCartCreate({});
    setCart(created);
    cartRef.current = created;
    return created;
  }, []);

  const reloadCart = useCallback(async (): Promise<Cart | null> => {
    if (!getAuthToken()) {
      setCart(null);
      cartRef.current = null;
      setError(null);
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const newCart = await ApiService.apiV1PublicCartCreate({});
      setCart(newCart);
      cartRef.current = newCart;
      return newCart;
    } catch (err: any) {
      const { data: errorData, message: errorMessage, brandCode, status, url } =
        getApiErrorInfo(err);

      console.error('Cart initialization error:', {
        message: errorMessage,
        brand_code: brandCode || 'Unknown',
        response: errorData,
        status,
        url,
        fullError: err,
      });

      if (err?.code === 'ECONNREFUSED' || err?.message?.includes('Network Error')) {
        setError('Cannot connect to backend server. Please ensure the Django backend is running.');
        return null;
      }

      if (status === 401 || status === 403) {
        setCart(null);
        cartRef.current = null;
        setError(null);
        return null;
      }

      if (err?.response?.status === 400 || err?.response?.status === 404) {
        if (errorMessage.includes('Brand') || errorMessage.includes('brand')) {
          setError(
            `Brand not configured: ${brandCode || 'Unknown'}. Run 'python manage.py create_default_brand' to create it.`
          );
        } else {
          setCart(null);
          cartRef.current = null;
        }
      } else {
        setError(errorMessage);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cart only for signed-in customers
  useEffect(() => {
    const handleAuthChange = () => {
      void reloadCart();
    };

    void reloadCart();
    window.addEventListener('auth-token-changed', handleAuthChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_token') handleAuthChange();
    });
    return () => {
      window.removeEventListener('auth-token-changed', handleAuthChange);
    };
  }, [reloadCart]);

  const updateCart = useCallback(async () => {
    const id = cartRef.current?.id;
    if (id === undefined) return;
    try {
      await refreshCartById(id);
    } catch (err: any) {
      setError(err.message || 'Failed to update cart');
    }
  }, [refreshCartById]);

  const addToCart = useCallback(
    async (
      inventoryUnitId: number,
      quantity: number = 1,
      promotionId?: number,
      unitPrice?: number
    ) => {
      if (!getAuthToken()) {
        throw new Error('Sign in required to add items to cart');
      }
      try {
        const currentCart = await ensureCart();
        const cartId = getCartId(currentCart);
        const cartItemRequest: CartItemCreateRequest = {
          inventory_unit_id: inventoryUnitId,
          quantity,
          promotion_id: promotionId,
          unit_price: unitPrice,
        };
        await ApiService.apiV1PublicCartItemsCreate(
          cartId,
          cartItemRequest as unknown as CartRequest
        );
        // Refresh by known id — do not rely on stale `cart` state from before create.
        await refreshCartById(cartId);
      } catch (err: any) {
        const { data, message, status, url } = getApiErrorInfo(err);
        console.error('Add to cart error details:', {
          message,
          response: data,
          status,
          url,
        });
        setError(message || 'Failed to add item to cart');
        throw err;
      }
    },
    [ensureCart, refreshCartById]
  );

  const addBundleToCart = useCallback(
    async (bundleId: number, mainInventoryUnitId?: number, bundleItemIds?: number[]) => {
      if (!getAuthToken()) {
        throw new Error('Sign in required to add items to cart');
      }
      try {
        const currentCart = await ensureCart();
        const cartId = getCartId(currentCart);
        const payload: BundleAddRequest = {
          bundle_id: bundleId,
          main_inventory_unit_id: mainInventoryUnitId,
          bundle_item_ids: bundleItemIds,
        };
        await ApiService.apiV1PublicCartBundlesCreate(cartId, payload as unknown as CartRequest);
        await refreshCartById(cartId);
      } catch (err: any) {
        const { message } = getApiErrorInfo(err);
        setError(message || 'Failed to add bundle to cart');
        throw err;
      }
    },
    [ensureCart, refreshCartById]
  );

  const updateCartPhone = useCallback(
    async (phone: string) => {
      if (!getAuthToken()) {
        throw new Error('Sign in required to add items to cart');
      }
      const currentCart = await ensureCart();
      const cartId = getCartId(currentCart);
      const updated = await ApiService.apiV1PublicCartPartialUpdate(cartId, {
        customer_phone: phone,
      });
      setCart(updated);
      cartRef.current = updated;
    },
    [ensureCart]
  );

  const removeFromCart = useCallback(
    async (itemId: number) => {
      const current = cartRef.current;
      if (!current?.id) {
        console.error('Cannot remove item: No cart available');
        return;
      }
      try {
        await ApiService.apiV1PublicCartItemsDestroy(current.id, String(itemId));
        await refreshCartById(current.id);
      } catch (err: any) {
        console.error('Error removing item from cart:', err);
        const { message } = getApiErrorInfo(err);
        setError(message || 'Failed to remove item from cart');
        throw err;
      }
    },
    [refreshCartById]
  );

  const checkout = useCallback(
    async (checkoutData: CartRequest): Promise<Cart> => {
      const current = cartRef.current;
      if (!current) throw new Error('No cart available');
      const cartId = getCartId(current);
      try {
        const response = await ApiService.apiV1PublicCartCheckoutCreate(cartId, checkoutData);
        await refreshCartById(cartId);
        return response;
      } catch (err: any) {
        const { message } = getApiErrorInfo(err);
        setError(message || 'Failed to checkout');
        throw err;
      }
    },
    [refreshCartById]
  );

  const clearCart = useCallback(() => {
    setCart(null);
    cartRef.current = null;
  }, []);

  const itemCount = (cart?.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const totalValue = cart?.total_value || 0;

  const value: CartContextType = {
    cart,
    isLoading,
    error,
    addToCart,
    addBundleToCart,
    updateCartPhone,
    removeFromCart,
    updateCart,
    reloadCart,
    checkout,
    clearCart,
    itemCount,
    totalValue,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
