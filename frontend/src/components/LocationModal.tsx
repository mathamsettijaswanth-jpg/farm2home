import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X, Check, Plus, AlertCircle, Search, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Address } from '../types';
import { InteractiveMap } from './InteractiveMap';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_AP_REGIONS = [
  { name: 'Vijayawada (Krishna)', village: 'Vijayawada Urban', district: 'Krishna', state: 'Andhra Pradesh', pincode: '520001', lat: 16.506, lng: 80.648 },
  { name: 'Guntur Rural', village: 'Guntur Rural', district: 'Guntur', state: 'Andhra Pradesh', pincode: '522002', lat: 16.306, lng: 80.436 },
  { name: 'Visakhapatnam', village: 'Visakhapatnam Coastal', district: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '530001', lat: 17.686, lng: 83.218 },
  { name: 'Tirupati Mandi', village: 'Tirupati Town', district: 'Tirupati', state: 'Andhra Pradesh', pincode: '517501', lat: 13.628, lng: 79.419 },
  { name: 'Kurnool Hub', village: 'Kurnool Town', district: 'Kurnool', state: 'Andhra Pradesh', pincode: '518001', lat: 15.828, lng: 78.037 },
  { name: 'Rajahmundry', village: 'Rajahmundry Urban', district: 'East Godavari', state: 'Andhra Pradesh', pincode: '533101', lat: 17.000, lng: 81.804 },
  { name: 'Kakinada Agro', village: 'Kakinada Town', district: 'Kakinada', state: 'Andhra Pradesh', pincode: '533001', lat: 16.989, lng: 82.247 },
  { name: 'Nellore Mandi', village: 'Nellore Rural', district: 'Nellore', state: 'Andhra Pradesh', pincode: '524001', lat: 14.442, lng: 79.986 }
];

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { user, selectedAddress, setSelectedAddress } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // New address form state (defaults to Andhra Pradesh)
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [label, setLabel] = useState<string>('Home');
  const [recipientName, setRecipientName] = useState<string>(user?.full_name || '');
  const [mobile, setMobile] = useState<string>(user?.mobile || '');
  const [addressLine, setAddressLine] = useState<string>('');
  const [villageTown, setVillageTown] = useState<string>('Vijayawada Urban');
  const [district, setDistrict] = useState<string>('Krishna');
  const [state, setState] = useState<string>('Andhra Pradesh');
  const [pincode, setPincode] = useState<string>('520001');
  const [lat, setLat] = useState<number>(16.506);
  const [lng, setLng] = useState<number>(80.648);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Location search query & results
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && user?.role === 'customer') {
      loadAddresses();
    }
  }, [isOpen, user]);

  const loadAddresses = async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('GPS geolocation not supported by browser. Please search your town/village below.');
      setIsLocating(false);
      setIsAddingNew(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLat(userLat);
        setLng(userLng);

        try {
          const geo = await api.reverseGeocode(userLat, userLng);
          setVillageTown(geo.village_town);
          setDistrict(geo.district);
          setState(geo.state);
          setPincode(geo.pincode);
          setAddressLine(geo.formatted_address);
          setIsAddingNew(true);
        } catch (err) {
          console.error('Reverse geocode failed:', err);
          setIsAddingNew(true);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        setIsAddingNew(true);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. You can search or select your Andhra Pradesh town below.');
        } else {
          setLocationError('GPS detection was not exact. Please pick your district or search below.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleSearchLocation = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await api.searchLocations(q);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search location', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (loc: any) => {
    setLat(loc.lat);
    setLng(loc.lng);
    setVillageTown(loc.village_town);
    setDistrict(loc.district);
    setState(loc.state);
    setPincode(loc.pincode || '520001');
    setAddressLine(loc.name);
    setSearchResults([]);
    setSearchQuery('');
    setIsAddingNew(true);
  };

  const handleSelectQuickRegion = (r: typeof POPULAR_AP_REGIONS[0]) => {
    setLat(r.lat);
    setLng(r.lng);
    setVillageTown(r.village);
    setDistrict(r.district);
    setState(r.state);
    setPincode(r.pincode);
    setAddressLine(`${r.village}, ${r.district}, ${r.state}`);
    setIsAddingNew(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine || !villageTown || !district) {
      alert('Please fill in village/town, district, and address details.');
      return;
    }

    try {
      setIsSaving(true);
      const newAddr = await api.addAddress({
        label,
        recipient_name: recipientName || user?.full_name || 'Customer',
        mobile: mobile || user?.mobile || '9876543210',
        address_line: addressLine,
        village_town: villageTown,
        district,
        state,
        pincode: pincode || '520001',
        latitude: lat,
        longitude: lng,
        is_default: true,
      });

      setSelectedAddress(newAddr);
      await loadAddresses();
      setIsAddingNew(false);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-950">Delivery Location</h2>
              <p className="text-xs text-emerald-700">Accurate delivery point across Andhra Pradesh & India</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-emerald-100/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Use GPS Button */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
          >
            <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Acquiring High-Precision GPS...' : 'Use My Current Location'}
          </button>

          {locationError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Quick Location Search Bar */}
          <div className="space-y-1 relative">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-stone-400" /> Search Andhra Pradesh Village or City:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchLocation(e.target.value)}
              placeholder="e.g. Vijayawada, Guntur, Tirupati, Vizag..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
            {isSearching && (
              <span className="text-[11px] text-stone-400 block pt-1">Searching OpenStreetMap...</span>
            )}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-xl mt-1 z-30 max-h-48 overflow-y-auto divide-y divide-stone-100">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSearchResult(r)}
                    className="w-full text-left p-2.5 text-xs hover:bg-emerald-50 text-stone-800 flex items-center justify-between"
                  >
                    <span className="truncate max-w-[80%] font-medium">{r.name}</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                      {r.district}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick AP Region Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-600" /> Popular Andhra Pradesh Hubs:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_AP_REGIONS.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectQuickRegion(r)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 bg-stone-50 hover:bg-emerald-100 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 transition font-medium"
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Saved Addresses List */}
          {!isAddingNew && addresses.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Saved Addresses</span>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Address
                </button>
              </div>

              <div className="space-y-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddress(addr);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-start justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60'
                          : 'border-stone-200 hover:border-emerald-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {addr.label}
                          </span>
                          <span className="text-sm font-semibold text-stone-900">{addr.recipient_name}</span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">{addr.address_line}</p>
                        <p className="text-xs font-medium text-emerald-800">
                          {addr.village_town}, {addr.district}, {addr.state} - {addr.pincode}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add / Edit New Address Form */}
          {isAddingNew && (
            <form onSubmit={handleSaveAddress} className="space-y-4 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900">Pinpoint Delivery Details</h3>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs text-stone-500 hover:underline"
                  >
                    Cancel & Pick Saved
                  </button>
                )}
              </div>

              {/* Interactive OpenStreetMap */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Drag Marker or Tap to Pinpoint Exact Location:</label>
                <InteractiveMap
                  latitude={lat}
                  longitude={lng}
                  onLocationSelect={async (newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                    try {
                      const geo = await api.reverseGeocode(newLat, newLng);
                      setVillageTown(geo.village_town);
                      setDistrict(geo.district);
                      setState(geo.state);
                      setPincode(geo.pincode);
                      setAddressLine(geo.formatted_address);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                />
                <p className="text-[11px] text-stone-500">
                  Current Coords: {lat.toFixed(4)}, {lng.toFixed(4)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Village / Town *</label>
                  <input
                    type="text"
                    required
                    value={villageTown}
                    onChange={(e) => setVillageTown(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Vijayawada Urban"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Krishna"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Andhra Pradesh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 520001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">House / Farm / Landmark Details *</label>
                <textarea
                  required
                  rows={2}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Plot number, farm lane, near canal or temple..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Contact Mobile</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Mobile number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow"
              >
                {isSaving ? 'Saving Address...' : 'Confirm Delivery Location'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
