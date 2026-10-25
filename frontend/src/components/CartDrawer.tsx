import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeItem,
    clearCart,
    isLoading
  } = useCart();

  if (!isCartDrawerOpen) return null;

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-600 text-white rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-950">My Harvest Cart</h2>
                <p className="text-xs text-emerald-700">
                  {cart?.item_count || 0} {cart?.item_count === 1 ? 'item' : 'items'} in cart
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-emerald-100/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Bar */}
          {cart && (
            <div className="bg-emerald-100/60 p-3 px-5 border-b border-emerald-200/60">
              {cart.amount_needed_for_free_delivery > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4 text-emerald-700" /> Add ₹{cart.amount_needed_for_free_delivery} more for Free Delivery!
                    </span>
                    <span>Goal: ₹{cart.free_delivery_threshold}</span>
                  </div>
                  <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, ((cart.subtotal) / cart.free_delivery_threshold) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <span className="p-1 rounded-full bg-emerald-600 text-white">✓</span>
                  <span>Awesome! You have unlocked FREE Doorstep Delivery!</span>
                </div>
              )}
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isEmpty ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl">
                  🥦
                </div>
                <h3 className="text-lg font-bold text-stone-900">Your Cart is Empty</h3>
                <p className="text-xs text-stone-500 max-w-xs">
                  Discover fresh vegetables, crisp leafy greens, and seasonal fruits directly from our farmers!
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-2 py-2.5 px-6 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-emerald-700"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((ci) => (
                <div
                  key={ci.id}
                  className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3.5"
                >
                  <img
                    src={ci.product?.image_url}
                    alt={ci.product?.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-stone-900 truncate">
                      {ci.product?.name}
                    </h4>
                    <p className="text-xs text-stone-500">
                      ₹{ci.product?.price_per_unit} / {ci.product?.unit_type}
                    </p>
                    <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                      Min: {ci.product?.min_order_quantity || 10} {ci.product?.unit_type}
                    </span>
                    <p className="text-xs font-bold text-emerald-800 mt-1">
                      ₹{ci.line_total.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => removeItem(ci.id)}
                      className="text-stone-400 hover:text-red-500 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center border border-stone-300 rounded-lg bg-white p-0.5">
                      <button
                        onClick={() => {
                          const minQ = ci.product?.min_order_quantity || 10;
                          if (ci.quantity <= minQ) {
                            if (confirm(`Minimum order is ${minQ} ${ci.product?.unit_type}. Remove from cart?`)) {
                              removeItem(ci.id);
                            }
                          } else {
                            updateQuantity(ci.id, ci.quantity - 1);
                          }
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-stone-100 text-stone-600"
                        title={`Minimum order is ${ci.product?.min_order_quantity || 10} ${ci.product?.unit_type}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-stone-900">
                        {ci.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(ci.id, ci.quantity + 1)}
                        disabled={ci.quantity >= (ci.product?.stock_quantity || 999)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-stone-100 text-stone-600 disabled:opacity-30"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Button */}
          {!isEmpty && cart && (
            <div className="p-5 bg-stone-50 border-t border-stone-200 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-stone-900">
                    {cart.delivery_fee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `₹${cart.delivery_fee.toFixed(2)}`
                    )}
                  </span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span>-₹{cart.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-stone-200 pt-2 flex justify-between text-base font-extrabold text-stone-900">
                  <span>Final Payable Amount</span>
                  <span className="text-emerald-700">₹{cart.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="py-3 px-4 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl font-semibold text-xs transition"
                >
                  Continue Shopping
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onCheckout();
                  }}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
