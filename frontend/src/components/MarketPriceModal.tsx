import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, X, RefreshCw, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { MarketPriceItem, MarketPriceResponse } from '../types';

interface MarketPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrice?: (item: MarketPriceItem) => void;
}

export const MarketPriceModal: React.FC<MarketPriceModalProps> = ({ isOpen, onClose, onSelectPrice }) => {
  const [data, setData] = useState<MarketPriceResponse | null>(null);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      loadPrices();
    }
  }, [isOpen]);

  const loadPrices = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMarketPrices();
      setData(res);
    } catch (err) {
      console.error('Failed to load market prices', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const items = data?.items || [];
  const filtered = items.filter(it =>
    it.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-emerald-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-800 text-white p-6 pb-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-emerald-100 backdrop-blur-md">
              <TrendingUp className="w-3.5 h-3.5" /> Official Mandi Rates
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Andhra Pradesh Daily Market Rates
            </h2>
            <p className="text-xs text-emerald-100 flex items-center gap-1.5">
              <span>Date: <strong>{data?.date || 'Today'}</strong></span> • 
              <a
                href="https://vegetablemarketprice.com/market/andhrapradesh/today"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-amber-200 inline-flex items-center gap-0.5"
              >
                vegetablemarketprice.com <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vegetable or fruit (e.g. Tomato, Onion, Chilli)..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={loadPrices}
            title="Refresh Prices"
            className="p-2 text-stone-600 hover:text-emerald-700 bg-white border border-stone-300 rounded-xl hover:bg-emerald-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content Table / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs font-semibold text-stone-500">
                Fetching today's Andhra Pradesh market prices...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              No vegetables matching "{search}" found in today's Andhra Pradesh mandi list.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filtered.map((item, idx) => (
                <div
                  key={idx}
                  className="py-3 px-2 flex items-center justify-between hover:bg-emerald-50/50 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-contain bg-stone-100 p-1 border border-stone-200"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        🌾
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{item.name}</h4>
                      <p className="text-[11px] text-stone-500">Unit: {item.unit}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-900">
                        Wholesale: <span className="text-sm font-extrabold text-emerald-700">₹{item.wholesale_price}</span> / {item.unit}
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        Retail: {item.retail_price_range}
                      </div>
                    </div>

                    {onSelectPrice && (
                      <button
                        onClick={() => {
                          onSelectPrice(item);
                          onClose();
                        }}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-center text-[11px] text-stone-500">
          Daily Mandi benchmark prices sourced from official Andhra Pradesh Agricultural Marketing data via vegetablemarketprice.com.
        </div>
      </div>
    </div>
  );
};
