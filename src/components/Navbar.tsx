import React, { useState } from 'react';
import {
  MapPin, ShoppingCart, User as UserIcon, Home,
  LogOut, Shield, ChevronDown, PackageCheck, Tractor
} from 'lucide-react';
import { LeafLogo } from './LeafLogo';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LocationModal } from './LocationModal';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onSearchChange?: (val: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onSearchChange }) => {
  const { user, selectedAddress, logout } = useAuth();
  const { cart, setIsCartDrawerOpen } = useCart();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const roleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'merchant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <Tractor className="w-3.5 h-3.5 text-amber-700" /> Farmer Account
          </span>
        );
      case 'management':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300">
            <Shield className="w-3.5 h-3.5 text-purple-700" /> Admin Management
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            🌱 Customer Buyer
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
        {/* Top bar for farmer helpline & demo alert */}
        <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">Kisan Call</span>
            <span className="font-medium">Direct Farmer Support: 1800-419-FARM (Toll Free)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-emerald-300 hidden md:inline">Demo Agricultural Marketplace</span>
            {roleBadge()}
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo and Home Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentTab('home')}
                className="text-left focus:outline-none"
              >
                <LeafLogo size="md" />
              </button>

              <button
                onClick={() => setCurrentTab('home')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition ${
                  currentTab === 'home'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-100'
                }`}
              >
                <Home className="w-4 h-4" /> Home
              </button>
            </div>

            {/* Location Selector (Customer & Guest) */}
            {(!user || user.role === 'customer') && (
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition"
              >
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="max-w-[200px] truncate">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">Delivering To</p>
                  <p className="text-xs font-semibold text-stone-900 truncate">
                    {selectedAddress
                      ? `${selectedAddress.village_town}, ${selectedAddress.district}`
                      : 'Select Village or Town'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>
            )}

            {/* Right Action Icons & User Menu */}
            <div className="flex items-center gap-2.5">
              {/* Customer Specific: Cart & Orders */}
              {(!user || user.role === 'customer') && (
                <>
                  <button
                    onClick={() => {
                      if (!user) {
                        setCurrentTab('auth');
                      } else {
                        setCurrentTab('orders');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      currentTab === 'orders'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-900'
                    }`}
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">My Orders</span>
                  </button>

                  {/* Cart Button */}
                  <button
                    onClick={() => {
                      if (!user) {
                        setCurrentTab('auth');
                      } else {
                        setIsCartDrawerOpen(true);
                      }
                    }}
                    className="relative p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition active:scale-95 flex items-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="hidden sm:inline font-bold text-sm">Cart</span>
                    {(cart?.item_count || 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-extrabold text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                        {cart?.item_count}
                      </span>
                    )}
                  </button>
                </>
              )}

              {/* Merchant Specific: Dashboard Button */}
              {user?.role === 'merchant' && (
                <button
                  onClick={() => setCurrentTab('merchant-dashboard')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-sm ${
                    currentTab === 'merchant-dashboard'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  <Tractor className="w-4 h-4" /> Seller Dashboard
                </button>
              )}

              {/* Management Specific: Admin Button */}
              {user?.role === 'management' && (
                <button
                  onClick={() => setCurrentTab('admin-dashboard')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-sm ${
                    currentTab === 'admin-dashboard'
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                  }`}
                >
                  <Shield className="w-4 h-4" /> Admin Portal
                </button>
              )}

              {/* User Account / Login */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-stone-200 hover:border-emerald-400 bg-stone-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold text-stone-800 hidden md:inline max-w-[120px] truncate">
                      {user.full_name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs font-bold text-stone-900 truncate">{user.full_name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{user.email || user.mobile}</p>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentTab('home');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2"
                      >
                        <Home className="w-4 h-4" /> Home Marketplace
                      </button>

                      {user.role === 'customer' && (
                        <button
                          onClick={() => {
                            setCurrentTab('orders');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2"
                        >
                          <PackageCheck className="w-4 h-4" /> My Orders
                        </button>
                      )}

                      {user.role === 'merchant' && (
                        <button
                          onClick={() => {
                            setCurrentTab('merchant-dashboard');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2"
                        >
                          <Tractor className="w-4 h-4" /> Farmer Dashboard
                        </button>
                      )}

                      {user.role === 'management' && (
                        <button
                          onClick={() => {
                            setCurrentTab('admin-dashboard');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" /> Management Dashboard
                        </button>
                      )}

                      <div className="border-t border-stone-100 my-1"></div>

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          setCurrentTab('home');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setCurrentTab('auth')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition active:scale-95 flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" /> Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
};
