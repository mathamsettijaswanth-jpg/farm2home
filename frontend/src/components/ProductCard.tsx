import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, MapPin, Calendar, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onLoginPrompt?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onLoginPrompt }) => {
  const { user } = useAuth();
  const { addToCart, isLoading } = useCart();
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 10;

  // Decimal safe calculation
  const itemTotal = (selectedQty * product.price_per_unit).toFixed(2);

  const handleIncrement = () => {
    if (selectedQty < product.stock_quantity) {
      setSelectedQty(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (selectedQty > 1) {
      setSelectedQty(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      if (onLoginPrompt) onLoginPrompt();
      return;
    }
    if (user.role !== 'customer') {
      alert('Only customer accounts can place orders. Please login as a customer.');
      return;
    }

    try {
      setIsAdding(true);
      await addToCart(product.id, selectedQty);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col group">
      {/* Product Image & Badges */}
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />

        {/* Harvest Badge */}
        {product.harvest_date && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-800 shadow flex items-center gap-1 border border-emerald-100">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{product.harvest_date}</span>
          </div>
        )}

        {/* Stock status indicator */}
        {isOutOfStock ? (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow">
            Out of Stock
          </div>
        ) : isLowStock ? (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow">
            Only {product.stock_quantity} left
          </div>
        ) : null}
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {product.category_name || 'Fresh Produce'}
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              {product.farm_location}
            </span>
          </div>

          <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {product.description || 'Farm-fresh harvest delivered directly from local cultivators.'}
          </p>

          <p className="text-xs text-emerald-800 font-medium">
            Sold by: <span className="font-bold">{product.merchant_farm || product.merchant_name}</span>
          </p>
        </div>

        {/* Price & Quantity Selector */}
        <div className="pt-3 border-t border-stone-100 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-stone-900">₹{product.price_per_unit}</span>
              <span className="text-xs text-stone-500 font-medium ml-1">/ {product.unit_type}</span>
            </div>
            {selectedQty > 1 && (
              <span className="text-xs font-semibold text-stone-500">
                Total: <strong className="text-emerald-700">₹{itemTotal}</strong>
              </span>
            )}
          </div>

          {/* Quantity Controls & Add to Cart */}
          <div className="flex items-center gap-2">
            {!isOutOfStock && (
              <div className="flex items-center border-2 border-emerald-200 rounded-xl bg-emerald-50/50 p-1 shrink-0">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={selectedQty <= 1}
                  className="w-8 h-8 rounded-lg bg-white text-stone-700 flex items-center justify-center font-bold hover:bg-emerald-100 disabled:opacity-40 transition shadow-sm"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-stone-900">
                  {selectedQty}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={selectedQty >= product.stock_quantity}
                  className="w-8 h-8 rounded-lg bg-white text-stone-700 flex items-center justify-center font-bold hover:bg-emerald-100 disabled:opacity-40 transition shadow-sm"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-sm ${
                justAdded
                  ? 'bg-emerald-700 text-white'
                  : isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" /> Added
                </>
              ) : isOutOfStock ? (
                'Sold Out'
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" /> Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
