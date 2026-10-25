import React from 'react';
import { LeafLogo } from './LeafLogo';
import { Phone, Mail, Heart, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3">
            <LeafLogo size="md" whiteText={true} />
            <p className="text-xs text-stone-400 leading-relaxed">
              Farm2Home bridges the gap between Indian cultivators and household consumers. Fresh, unadulterated produce delivered with transparent farmer-first pricing.
            </p>
          </div>

          {/* Farmer Helpline */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Kisan Helpline</h4>
            <div className="space-y-1.5 text-xs text-stone-400">
              <p className="flex items-center gap-2 text-emerald-400 font-bold">
                <Phone className="w-4 h-4" /> 1800-419-FARM (Toll Free)
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-stone-500" /> support@farm2home.org
              </p>
              <p className="text-[11px] text-stone-500">Available: Monday to Saturday, 6 AM to 8 PM</p>
            </div>
          </div>

          {/* Crop Categories */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Produce Categories</h4>
            <ul className="text-xs space-y-1.5 text-stone-400">
              <li>• Daily Country Vegetables</li>
              <li>• Orchard Fresh Fruits</li>
              <li>• Organic Leafy Greens (Palak, Methi)</li>
              <li>• Unpolished Grains & Pulses</li>
              <li>• Farm Harvest Spices</li>
            </ul>
          </div>

          {/* Safe demo notice */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Simulated Platform</h4>
            <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700 text-xs text-stone-300 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" /> Demo Environment
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED. All UPI, cards, and payouts are simulated for development demonstration.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <p>© 2026 Farm2Home Agricultural Marketplace. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Empowering Indian agriculture with direct technology
          </p>
        </div>
      </div>
    </footer>
  );
};
