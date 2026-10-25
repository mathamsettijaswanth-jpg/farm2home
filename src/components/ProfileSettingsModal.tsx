import React, { useState, useEffect } from 'react';
import { User, X, Check, Save, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [email, setEmail] = useState(user?.email || '');
  const [villageTown, setVillageTown] = useState(user?.customer_profile?.village_town || 'Vijayawada Urban');
  const [district, setDistrict] = useState(user?.customer_profile?.district || 'Krishna');
  const [state, setState] = useState(user?.customer_profile?.state || 'Andhra Pradesh');
  const [addressLine, setAddressLine] = useState(user?.customer_profile?.default_address || '');
  const [deliverySlot, setDeliverySlot] = useState(user?.customer_profile?.preferred_delivery_slot || 'Morning (7:00 AM - 10:00 AM)');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setMobile(user.mobile || '');
      setEmail(user.email || '');
      if (user.customer_profile) {
        setVillageTown(user.customer_profile.village_town || 'Vijayawada Urban');
        setDistrict(user.customer_profile.district || 'Krishna');
        setState(user.customer_profile.state || 'Andhra Pradesh');
        setAddressLine(user.customer_profile.default_address || '');
        setDeliverySlot(user.customer_profile.preferred_delivery_slot || 'Morning (7:00 AM - 10:00 AM)');
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.updateCustomerProfile({
        full_name: fullName,
        mobile,
        email,
        village_town: villageTown,
        district,
        state,
        default_address: addressLine,
        preferred_delivery_slot: deliverySlot,
      });

      setSuccessMsg('Profile updated successfully!');
      // Update local storage user if returned
      if (res.user) {
        localStorage.setItem('farm2home_user', JSON.stringify(res.user));
      }
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
        window.location.reload(); // Refresh context
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-emerald-950">My Profile Settings</h2>
              <p className="text-xs text-emerald-700">Update personal and delivery preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-emerald-100/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          {/* Account Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Account Information
            </h3>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" /> Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="10-digit number"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="Email"
                />
              </div>
            </div>
          </div>

          {/* Location & Delivery Defaults */}
          <div className="space-y-3 pt-3 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Home Region & Address
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Village/Town *</label>
                <input
                  type="text"
                  required
                  value={villageTown}
                  onChange={(e) => setVillageTown(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  placeholder="e.g. Vijayawada"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  placeholder="e.g. Krishna"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  placeholder="Andhra Pradesh"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Default Address Line</label>
              <textarea
                rows={2}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="House / Door No., Street, Landmark..."
                className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" /> Preferred Delivery Slot
              </label>
              <select
                value={deliverySlot}
                onChange={(e) => setDeliverySlot(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-xl bg-white"
              >
                <option value="Morning (7:00 AM - 10:00 AM)">Morning (7:00 AM - 10:00 AM)</option>
                <option value="Afternoon (12:00 PM - 3:00 PM)">Afternoon (12:00 PM - 3:00 PM)</option>
                <option value="Evening (5:00 PM - 8:00 PM)">Evening (5:00 PM - 8:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 text-sm font-semibold text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
