import React, { useState } from 'react';
import {
  User, Tractor, Shield, Lock, Eye, EyeOff,
  Phone, Mail, CheckCircle2, AlertCircle, ArrowLeft,
  Sparkles, KeyRound, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserRole } from '../types';
import { LeafLogo } from '../components/LeafLogo';

interface AuthPageProps {
  onSuccess: () => void;
  onBackToHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBackToHome }) => {
  const { login } = useAuth();

  // Selected role for login/registration
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // Form states
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // OTP form state
  const [otpMobile, setOtpMobile] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);

  // Forgot password form state
  const [forgotIdent, setForgotIdent] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  // Customer register state
  const [custName, setCustName] = useState<string>('');
  const [custMobile, setCustMobile] = useState<string>('');
  const [custEmail, setCustEmail] = useState<string>('');
  const [custPassword, setCustPassword] = useState<string>('');
  const [custAddress, setCustAddress] = useState<string>('');
  const [custVillage, setCustVillage] = useState<string>('Shadnagar');
  const [custDistrict, setCustDistrict] = useState<string>('Rangareddy');
  const [custState, setCustState] = useState<string>('Telangana');

  // Merchant register state
  const [farmName, setFarmName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [merchMobile, setMerchMobile] = useState<string>('');
  const [merchEmail, setMerchEmail] = useState<string>('');
  const [merchPassword, setMerchPassword] = useState<string>('');
  const [farmAddress, setFarmAddress] = useState<string>('');
  const [farmVillage, setFarmVillage] = useState<string>('Devanahalli');
  const [farmDistrict, setFarmDistrict] = useState<string>('Bengaluru Rural');
  const [farmState, setFarmState] = useState<string>('Karnataka');
  const [categoriesOffered, setCategoriesOffered] = useState<string>('Vegetables, Fruits, Leafy vegetables');
  const [docNote, setDocNote] = useState<string>('Kisan Credit Card (KCC-9821)');

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setMode('login');
    resetFormState();
  };

  // Quick demo account pre-fill
  const handleQuickDemoFill = (role: UserRole) => {
    setSelectedRole(role);
    setMode('login');
    resetFormState();
    if (role === 'customer') {
      setIdentifier('customer@farm2home.org');
      setPassword('customer123');
    } else if (role === 'merchant') {
      setIdentifier('farmer@farm2home.org');
      setPassword('farmer123');
    } else if (role === 'management') {
      setIdentifier('admin@farm2home.org');
      setPassword('admin123');
    }
  };

  // 1. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.login({
        identifier: identifier.trim(),
        password,
        role: selectedRole || undefined,
        remember_me: rememberMe,
      });

      login(res.access_token, res.user);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Demo OTP Request
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.sendDemoOtp(otpMobile, selectedRole || 'customer');
      setOtpSentMessage(res.message);
      setOtpCode(res.demo_code); // Pre-fill demo code for effortless testing!
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch demo OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2b. Demo OTP Verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.verifyDemoOtp(otpMobile, otpCode, selectedRole || 'customer');
      login(res.access_token, res.user);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Customer Registration
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.registerCustomer({
        full_name: custName,
        mobile: custMobile,
        email: custEmail,
        password: custPassword,
        delivery_address: custAddress,
        village_town: custVillage,
        district: custDistrict,
        state: custState,
      });

      login(res.access_token, res.user);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Merchant Registration
  const handleMerchantRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.registerMerchant({
        farm_or_shop_name: farmName,
        contact_person: contactPerson,
        mobile: merchMobile,
        email: merchEmail,
        password: merchPassword,
        farm_address: farmAddress,
        village: farmVillage,
        district: farmDistrict,
        state: farmState,
        categories_offered: categoriesOffered,
        business_document_note: docNote,
      });

      login(res.access_token, res.user);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Merchant registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.forgotPassword(forgotIdent, newPassword);
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode('login');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button */}
      <div className="w-full max-w-4xl mb-6 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 py-2 px-3.5 rounded-xl border border-emerald-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Marketplace
        </button>
        <LeafLogo size="sm" />
      </div>

      {/* Screen 1: Three Large Role Selection Cards */}
      {!selectedRole && (
        <div className="max-w-4xl w-full space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Welcome to <span className="text-emerald-700">Farm2Home</span>
            </h1>
            <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
              Direct connection between local farmers and home consumers. Please select how you want to use the marketplace today:
            </p>
          </div>

          {/* Quick 1-Click Evaluation Bar */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-900 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>One-Click Demo Tester: Instant login with pre-configured accounts:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleQuickDemoFill('customer')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Customer Login
              </button>
              <button
                onClick={() => handleQuickDemoFill('merchant')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Farmer Login
              </button>
              <button
                onClick={() => handleQuickDemoFill('management')}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Admin Login
              </button>
            </div>
          </div>

          {/* Three Large Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card A: User Login (Customer) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-100 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-sm">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">User / Buyer</h3>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">Household & Family</p>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Discover fresh farm vegetables, seasonal fruits, and harvest produce at fair prices delivered to your doorstep.
                </p>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  onClick={() => handleRoleSelect('customer')}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow active:scale-[0.98]"
                >
                  Enter as Customer
                </button>
                <p className="text-[11px] text-center text-stone-400">Buying fresh produce</p>
              </div>
            </div>

            {/* Card B: Merchant Login (Farmer) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-amber-100 hover:border-amber-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-sm">
                  <Tractor className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Merchant / Kisan</h3>
                  <p className="text-xs text-amber-700 font-semibold mt-0.5">Farmers & Agro Sellers</p>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  List your daily crop harvests, set your own selling price, manage customer orders, and eliminate middlemen fees.
                </p>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  onClick={() => handleRoleSelect('merchant')}
                  className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition shadow active:scale-[0.98]"
                >
                  Enter as Farmer
                </button>
                <p className="text-[11px] text-center text-stone-400">Selling farm harvest</p>
              </div>
            </div>

            {/* Card C: Management Login (Admin) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-purple-100 hover:border-purple-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-sm">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Management</h3>
                  <p className="text-xs text-purple-700 font-semibold mt-0.5">Platform Administrators</p>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Oversee verified farmers, manage quality moderation, monitor orders, configure delivery fees, and view payments.
                </p>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  onClick={() => handleRoleSelect('management')}
                  className="w-full py-3.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl transition shadow active:scale-[0.98]"
                >
                  Enter as Admin
                </button>
                <p className="text-[11px] text-center text-stone-400">Restricted staff access</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Role-Specific Authentication Forms */}
      {selectedRole && (
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl space-y-6 animate-fade-in">
          {/* Header & Change Role Button */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <button
              onClick={() => setSelectedRole(null)}
              className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change Role
            </button>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {selectedRole === 'customer' && <span className="text-emerald-700">🌱 Customer Portal</span>}
              {selectedRole === 'merchant' && <span className="text-amber-700">🚜 Farmer Portal</span>}
              {selectedRole === 'management' && <span className="text-purple-700">🛡️ Admin Portal</span>}
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Demo Pre-fill Button */}
          <button
            type="button"
            onClick={() => handleQuickDemoFill(selectedRole)}
            className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            Quick Pre-fill Sample Credentials
          </button>

          {/* Sub Navigation (Login / OTP / Register / Forgot) */}
          <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold text-stone-600">
            <button
              onClick={() => { setMode('login'); resetFormState(); }}
              className={`flex-1 py-2 rounded-lg transition ${mode === 'login' ? 'bg-white text-stone-900 shadow-sm' : 'hover:text-stone-900'}`}
            >
              Password Login
            </button>
            {selectedRole !== 'management' && (
              <button
                onClick={() => { setMode('otp'); resetFormState(); }}
                className={`flex-1 py-2 rounded-lg transition ${mode === 'otp' ? 'bg-white text-stone-900 shadow-sm' : 'hover:text-stone-900'}`}
              >
                Mobile OTP
              </button>
            )}
            {selectedRole !== 'management' && (
              <button
                onClick={() => { setMode('register'); resetFormState(); }}
                className={`flex-1 py-2 rounded-lg transition ${mode === 'register' ? 'bg-white text-stone-900 shadow-sm' : 'hover:text-stone-900'}`}
              >
                Register
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* TAB 1: Password Login */}
          {/* ======================================================== */}
          {mode === 'login' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mobile Number or Email Address *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or name@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="absolute right-3 top-3 text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-stone-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? 'Logging in...' : 'Sign In Now'}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: Demo OTP Flow */}
          {/* ======================================================== */}
          {mode === 'otp' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <strong>Farmer Demo Flow:</strong> Enter your mobile number. A simulated verification OTP code will appear for instant testing. (No real SMS is charged).
              </div>

              {!otpSentMessage ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      10-Digit Mobile Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={otpMobile}
                        onChange={(e) => setOtpMobile(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <Phone className="w-4 h-4 absolute right-3 top-3 text-stone-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition"
                  >
                    {isSubmitting ? 'Sending Code...' : 'Get Demo OTP Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900">
                    {otpSentMessage}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Enter 6-Digit OTP Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full tracking-widest text-center text-lg font-bold px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpSentMessage(null)}
                      className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
                    >
                      Resend
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify & Enter'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: Customer Registration Form */}
          {/* ======================================================== */}
          {mode === 'register' && selectedRole === 'customer' && (
            <form onSubmit={handleCustomerRegister} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={custMobile}
                    onChange={(e) => setCustMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={custPassword}
                  onChange={(e) => setCustPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="House number, street lane, landmark..."
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Village/Town *</label>
                  <input
                    type="text"
                    required
                    value={custVillage}
                    onChange={(e) => setCustVillage(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={custDistrict}
                    onChange={(e) => setCustDistrict(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={custState}
                    onChange={(e) => setCustState(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition"
              >
                {isSubmitting ? 'Registering...' : 'Complete Customer Registration'}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 4: Farmer / Merchant Registration Form */}
          {/* ======================================================== */}
          {mode === 'register' && selectedRole === 'merchant' && (
            <form onSubmit={handleMerchantRegister} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Farmer or Business Name *</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Green Acres Organic Farm"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={merchMobile}
                    onChange={(e) => setMerchMobile(e.target.value)}
                    placeholder="9876543211"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={merchEmail}
                    onChange={(e) => setMerchEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={merchPassword}
                  onChange={(e) => setMerchPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Farm or Shop Address *</label>
                <textarea
                  required
                  rows={2}
                  value={farmAddress}
                  onChange={(e) => setFarmAddress(e.target.value)}
                  placeholder="Survey No, Near Canal / Market Yard..."
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Village *</label>
                  <input
                    type="text"
                    required
                    value={farmVillage}
                    onChange={(e) => setFarmVillage(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={farmDistrict}
                    onChange={(e) => setFarmDistrict(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={farmState}
                    onChange={(e) => setFarmState(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Kisan Document / APMC License Note</label>
                <input
                  type="text"
                  value={docNote}
                  onChange={(e) => setDocNote(e.target.value)}
                  placeholder="e.g. Kisan Credit Card No. 12345"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow transition"
              >
                {isSubmitting ? 'Registering...' : 'Register as Agricultural Merchant'}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 5: Forgot Password */}
          {/* ======================================================== */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Registered Email or Mobile *
                </label>
                <input
                  type="text"
                  required
                  value={forgotIdent}
                  onChange={(e) => setForgotIdent(e.target.value)}
                  placeholder="e.g. 9876543210 or email"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="py-3 px-4 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow"
                >
                  {isSubmitting ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
