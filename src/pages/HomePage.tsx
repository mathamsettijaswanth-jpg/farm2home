import React, { useState, useEffect } from 'react';
import {
  Search, SlidersHorizontal, Sparkles, MapPin,
  RefreshCw, Carrot, Apple, Salad, Wheat, Flame,
  Store, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onLoginPrompt: () => void;
  onOpenLocation: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLoginPrompt, onOpenLocation }) => {
  const { user, selectedAddress } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceMax, setPriceMax] = useState<number>(300);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategorySlug, searchQuery, priceMax, inStockOnly]);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProducts({
        category: selectedCategorySlug === 'all' ? undefined : selectedCategorySlug,
        search: searchQuery || undefined,
        max_price: priceMax,
        in_stock_only: inStockOnly,
      });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'vegetables': return <Carrot className="w-5 h-5 text-orange-600" />;
      case 'fruits': return <Apple className="w-5 h-5 text-red-500" />;
      case 'leafy-vegetables': return <Salad className="w-5 h-5 text-emerald-600" />;
      case 'grains-pulses': return <Wheat className="w-5 h-5 text-amber-700" />;
      case 'spices': return <Flame className="w-5 h-5 text-red-600" />;
      default: return <Store className="w-5 h-5 text-emerald-700" />;
    }
  };

  const featuredProducts = products.filter(p => p.is_featured);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero / Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-900 text-white p-6 sm:p-10 lg:p-12 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-emerald-100 border border-white/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 100% Farm Harvested Fresh
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Fresh Vegetables & Fruits <br className="hidden sm:inline" />
            <span className="text-amber-300">Direct From Indian Farmers</span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100 leading-relaxed max-w-xl">
            Harvested today at dawn, unadulterated, and brought straight to your kitchen door. Zero middleman markup, guaranteed fair farmer pricing.
          </p>

          {/* Current Delivery Point Banner */}
          <div className="pt-2">
            <button
              onClick={onOpenLocation}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-950 font-bold text-xs sm:text-sm rounded-xl shadow-md hover:bg-emerald-50 transition active:scale-95"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>
                Delivering to:{' '}
                <strong>
                  {selectedAddress
                    ? `${selectedAddress.village_town}, ${selectedAddress.district}`
                    : 'Select Your Delivery Location'}
                </strong>
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>

        {/* Decorative background leaf illustration */}
        <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none translate-x-12 translate-y-12">
          <div className="text-[280px]">🌱</div>
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tomatoes, onions, spinach, mangoes, basmati..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold border transition shadow-sm ${
              isFilterOpen || priceMax < 300 || inStockOnly
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Expanded Filters Drawer */}
        {isFilterOpen && (
          <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Max Price Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-stone-700">
                  <span>Maximum Price</span>
                  <span className="text-emerald-700 font-extrabold text-sm">₹{priceMax}</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="300"
                  step="5"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-stone-400">
                  <span>₹15</span>
                  <span>₹300</span>
                </div>
              </div>

              {/* Stock Filter Checkbox */}
              <div className="flex items-center">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Show Available in Stock Only</span>
                </label>
              </div>

              {/* Reset button */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPriceMax(300);
                    setInStockOnly(false);
                    setSelectedCategorySlug('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-stone-500 hover:text-emerald-700 underline"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Category Pills (Vegetables, Fruits, Leafy vegetables, Grains and pulses, Spices, Other farm products) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-stone-900">Explore Crop Categories</h2>
          <span className="text-xs text-stone-500 font-medium">Direct harvest</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategorySlug('all')}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold shrink-0 transition shadow-sm ${
              selectedCategorySlug === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-300'
            }`}
          >
            <span>🌾 All Farm Produce</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold shrink-0 transition shadow-sm ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-300'
                }`}
              >
                {getCategoryIcon(cat.slug)}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Fresh Harvest Carousel / Section */}
      {featuredProducts.length > 0 && selectedCategorySlug === 'all' && !searchQuery && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-stone-900">Today's Featured Harvest</h2>
                <p className="text-xs text-stone-500">Specially recommended fresh arrivals from local mandis</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featuredProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onLoginPrompt={onLoginPrompt}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Product Catalog Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">
              {selectedCategorySlug === 'all' ? 'All Farm Products' : `${categories.find(c => c.slug === selectedCategorySlug)?.name || 'Products'}`}
            </h2>
            <p className="text-xs text-stone-500">
              {products.length} {products.length === 1 ? 'product' : 'products'} available
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-semibold text-stone-500">Loading fresh harvest produce...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-3">
            <div className="text-4xl">🌾</div>
            <h3 className="text-base font-bold text-stone-800">No Farm Products Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              We couldn't find any products matching your search or filters. Try adjusting your category or price range!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onLoginPrompt={onLoginPrompt}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
