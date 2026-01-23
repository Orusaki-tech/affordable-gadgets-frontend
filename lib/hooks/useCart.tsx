/**
 * Cart Context and Hook
 */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ApiService, Cart, CartItemRequest, CartRequest } from '@/lib/api/generated';
import { getApiErrorInfo } from '@/lib/utils/apiError';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (inventoryUnitId: number, quantity?: number, promotionId?: number, unitPrice?: number) => Promise<void>;
  addBundleToCart: (bundleId: number, mainInventoryUnitId?: number, bundleItemIds?: number[]) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateCart: () => Promise<void>;
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

  // Get or create cart on mount
  useEffect(() => {
    const initCart = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors
        
        const sessionKey = typeof window !== 'undefined' ? localStorage.getItem('session_key') || undefined : undefined;
        
        // Store session key if not exists
        if (typeof window !== 'undefined' && !localStorage.getItem('session_key')) {
          localStorage.setItem('session_key', `session_${Date.now()}`);
        }
        
        console.log('Initializing cart with session key:', sessionKey);
        const newCart = await ApiService.apiV1PublicCartCreate({
          session_key: sessionKey,
        });
        setCart(newCart);
        console.log('Cart initialized successfully:', newCart.id);
      } catch (err: any) {
        const { data: errorData, message: errorMessage, brandCode, status, url } = getApiErrorInfo(err);
        
        console.error('Cart initialization error:', {
          message: errorMessage,
          brand_code: brandCode || 'Unknown',
          response: errorData,
          status,
          url,
          fullError: err,
        });
        
        // Handle connection errors
        if (err?.code === 'ECONNREFUSED' || err?.message?.includes('Network Error')) {
          setError('Cannot connect to backend server. Please ensure the Django backend is running.');
          return; // Don't try to create cart if backend is down
        }
        
        // Don't set error for 400/404 - cart might not exist yet, which is fine
        // Cart will be created when first item is added
        if (err?.response?.status === 400 || err?.response?.status === 404) {
          if (errorMessage.includes('Brand') || errorMessage.includes('brand')) {
            console.error(`Brand configuration error: Brand code "${brandCode || 'Unknown'}" is not configured or inactive.`);
            console.error('To fix this, run: python manage.py create_default_brand');
            setError(`Brand not configured: ${brandCode || 'Unknown'}. Run 'python manage.py create_default_brand' to create it.`);
          } else {
            console.warn('Cart not available yet, will be created on first add:', errorMessage);
            setCart(null);
          }
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initCart();
  }, []);

  const updateCart = useCallback(async () => {
    if (!cart) return;
    try {
      if (cart.id === undefined) return;
      const updatedCart = await ApiService.apiV1PublicCartRetrieve(cart.id);
      // If cart has no items, clear it
      if (!updatedCart.items || updatedCart.items.length === 0) {
        console.log('Cart is empty, clearing from state');
        setCart(null);
        return;
      }
      setCart(updatedCart);
    } catch (err: any) {
      // If cart is not found (404), it has been deleted (e.g., after payment confirmation)
      // Clear the cart from state so the UI reflects that it's been cleared
      if (err?.response?.status === 404) {
        console.log('Cart not found (deleted) - clearing from state');
        setCart(null);
        return;
      }
      setError(err.message || 'Failed to update cart');
    }
  }, [cart]);

  const addToCart = useCallback(async (
    inventoryUnitId: number, 
    quantity: number = 1,
    promotionId?: number,
    unitPrice?: number
  ) => {
    try {
      let currentCart = cart;
      
      // Create cart if it doesn't exist
      if (!currentCart) {
        console.log('Cart not found, creating new cart...');
        const sessionKey = typeof window !== 'undefined' ? localStorage.getItem('session_key') || undefined : undefined;
        try {
          currentCart = await ApiService.apiV1PublicCartCreate({
            session_key: sessionKey,
          });
          setCart(currentCart);
          console.log('Cart created successfully:', currentCart.id);
        } catch (cartErr: any) {
          const { data, message, status, url } = getApiErrorInfo(cartErr);
          console.error('Failed to create cart:', {
            message,
            response: data,
            status,
            url,
          });
          throw new Error(message || 'Failed to create cart');
        }
      }
      
      // Add item to cart with promotion info
      const cartId = getCartId(currentCart);
      console.log('Adding item to cart:', { 
        cartId, 
        inventoryUnitId, 
        quantity,
        promotionId,
        unitPrice
      });
      const cartItemRequest: CartItemCreateRequest = {
        inventory_unit_id: inventoryUnitId,
        quantity,
        promotion_id: promotionId,
        unit_price: unitPrice,
      };
      await ApiService.apiV1PublicCartItemsCreate(cartId, cartItemRequest as unknown as CartRequest);
      await updateCart();
      console.log('Item added successfully');
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
  }, [cart, updateCart]);

  const addBundleToCart = useCallback(async (
    bundleId: number,
    mainInventoryUnitId?: number,
    bundleItemIds?: number[]
  ) => {
    try {
      let currentCart = cart;
      if (!currentCart) {
        const sessionKey = typeof window !== 'undefined' ? localStorage.getItem('session_key') || undefined : undefined;
        currentCart = await ApiService.apiV1PublicCartCreate({
          session_key: sessionKey,
        });
        setCart(currentCart);
      }
      const cartId = getCartId(currentCart);
      const payload: BundleAddRequest = {
        bundle_id: bundleId,
        main_inventory_unit_id: mainInventoryUnitId,
        bundle_item_ids: bundleItemIds,
      };
      await ApiService.apiV1PublicCartBundlesCreate(cartId, payload as unknown as CartRequest);
      await updateCart();
    } catch (err: any) {
      const { message } = getApiErrorInfo(err);
      setError(message || 'Failed to add bundle to cart');
      throw err;
    }
  }, [cart, updateCart]);

  const removeFromCart = useCallback(async (itemId: number) => {
    if (!cart) {
      console.error('Cannot remove item: No cart available');
      return;
    }
    if (cart.id === undefined) {
      console.error('Cannot remove item: Cart ID is missing');
      return;
    }
    try {
      console.log(`Removing item ${itemId} from cart ${cart.id}`);
      await ApiService.apiV1PublicCartItemsDestroy(cart.id, String(itemId));
      console.log('Item removed successfully, updating cart...');
      await updateCart();
      console.log('Cart updated successfully');
    } catch (err: any) {
      console.error('Error removing item from cart:', err);
      const { message } = getApiErrorInfo(err);
      setError(message || 'Failed to remove item from cart');
      throw err; // Re-throw so UI can handle it
    }
  }, [cart, updateCart]);

  const checkout = useCallback(async (checkoutData: CartRequest): Promise<Cart> => {
    if (!cart) throw new Error('No cart available');
    const cartId = getCartId(cart);
    try {
      const response = await ApiService.apiV1PublicCartCheckoutCreate(cartId, checkoutData);
      // Don't clear cart - keep it for reference until lead is converted to order
      // The cart is now linked to the lead via cart.lead
      // Just refresh the cart to show it's submitted
      await updateCart();
      return response;
    } catch (err: any) {
      const { message } = getApiErrorInfo(err);
      setError(message || 'Failed to checkout');
      throw err;
    }
  }, [cart, updateCart]);

  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  const itemCount = (cart?.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const totalValue = cart?.total_value || 0;

  const value: CartContextType = {
    cart,
    isLoading,
    error,
    addToCart,
    addBundleToCart,
    removeFromCart,
    updateCart,
    checkout,
    clearCart,
    itemCount,
    totalValue,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

