import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartSummary } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartSummary | null;
  isLoading: boolean;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  const refreshCart = async () => {
    if (!token || user?.role !== 'customer') {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await api.getCart();
      setCart(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [token, user?.role]);

  const addToCart = async (productId: number, quantity: number) => {
    try {
      setIsLoading(true);
      const updated = await api.addToCart(productId, quantity);
      setCart(updated);
      setIsCartDrawerOpen(true); // Provide instant feedback
    } catch (err: any) {
      alert(err.message || 'Could not add product to cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      setIsLoading(true);
      const updated = await api.updateCartItem(itemId, quantity);
      setCart(updated);
    } catch (err: any) {
      alert(err.message || 'Could not update quantity');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      setIsLoading(true);
      const updated = await api.removeCartItem(itemId);
      setCart(updated);
    } catch (err: any) {
      alert(err.message || 'Could not remove item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      await api.clearCart();
      await refreshCart();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
