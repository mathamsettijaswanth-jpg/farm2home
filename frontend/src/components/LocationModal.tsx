import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X, Check, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Address } from '../types';
import { InteractiveMap } from './InteractiveMap';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { user, selectedAddress, setSelectedAddress } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // New address form state
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [label, setLabel] = useState<string>('Home');
  const [recipientName, setRecipientName] = useState<string>(user?.full_name || '');
  const [mobile, setMobile] = useState<string>(user?.mobile || '');
  const [addressLine, setAddressLine] = useState<string>('');
  const [villageTown, setVillageTown] = useState<string>('Shadnagar Rural');
  const [district, setDistrict] = useState<string>('Rangareddy');
  const [state, setState] = useState<string>('Telangana');
  const [pincode, setPincode] = useState<string>('509216');
  const [lat, setLat] = useState<number>(17.067);
  const [lng, setLng] = useState<number>(78.204);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
      setLocationError('Geolocation is not supported by your browser. Please enter your address manually.');
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
          setLocationError('Location permission denied. No problem! Please enter your village/town address below.');
        } else {
          setLocationError('Could not retrieve GPS location. Please enter your address details below.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine || !villageTown || !district) {
      alert('Please fill in village/town, district, and address.');
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
        pincode: pincode || '500001',
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
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-950">Delivery Location</h2>
              <p className="text-xs text-emerald-700">Select where you want your fresh farm harvest delivered</p>
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
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
          >
            <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Detecting your GPS location...' : 'Use My Current Location'}
          </button>

          {locationError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Saved Addresses List */}
          {!isAddingNew && addresses.length > 0 && (
            <div className="space-y-3">
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
                <h3 className="text-sm font-bold text-stone-900">Enter Delivery Details</h3>
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
                <label className="text-xs font-semibold text-stone-700">Pinpoint Delivery Point on Map:</label>
                <InteractiveMap
                  latitude={lat}
                  longitude={lng}
                  onLocationSelect={(newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                  }}
                />
                <p className="text-[11px] text-stone-500">Tap or drag the pin to set delivery gate/farm entrance.</p>
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
                    placeholder="e.g. Shadnagar Rural"
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
                    placeholder="e.g. Rangareddy"
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
                    placeholder="e.g. Telangana"
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
                    placeholder="e.g. 509216"
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
                  placeholder="Plot number, farm lane, near water tank..."
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
                    placeholder="Ananya Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Contact Mobile</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow"
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
