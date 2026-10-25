import React, { useState } from 'react';
import {
  CheckCircle, ArrowLeft, ArrowRight, MapPin, Calendar,
  CreditCard, Smartphone, Banknote, ShieldAlert, AlertTriangle,
  RotateCcw, Sparkles, Truck, Check, ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, DemoPayment } from '../types';

interface CheckoutPageProps {
  onBackToShopping: () => void;
  onViewOrders: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToShopping, onViewOrders }) => {
  const { cart, refreshCart } = useCart();
  const { user, selectedAddress } = useAuth();

  // Multi-step checkout states (1: Confirm, 2: Address, 3: Slot, 4: Review, 5: Payment, 6: Done)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Delivery slot
  const [selectedSlot, setSelectedSlot] = useState<string>('Morning (7:00 AM - 10:00 AM)');
  const [notes, setNotes] = useState<string>('');

  // Created order state
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Payment simulation state
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>('UPI');
  const [upiVpa, setUpiVpa] = useState<string>('ananya@okhdfcbank');
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  const [paymentResult, setPaymentResult] = useState<DemoPayment | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const deliverySlots = [
    { id: '1', title: 'Morning Fresh Slot', time: '7:00 AM - 10:00 AM', desc: 'Picked today at dawn' },
    { id: '2', title: 'Afternoon Slot', time: '12:00 PM - 3:00 PM', desc: 'Midday dispatch' },
    { id: '3', title: 'Evening Slot', time: '5:00 PM - 8:00 PM', desc: 'After-work home delivery' },
  ];

  // Handler to place the order
  const handleProceedToPayment = async () => {
    if (!selectedAddress) {
      alert('Please select or specify a delivery address.');
      setCurrentStep(2);
      return;
    }

    try {
      setIsCheckingOut(true);
      setCheckoutError(null);

      const order = await api.checkout({
        address_id: selectedAddress.id,
        delivery_slot: selectedSlot,
        notes: notes.trim() || undefined,
      });

      setCreatedOrder(order);
      await refreshCart();
      setCurrentStep(5); // Move directly to payment simulation
    } catch (err: any) {
      setCheckoutError(err.message || 'Could not place order. Please review your cart.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Handler to simulate demo payment
  const handleSimulatePayment = async () => {
    if (!createdOrder) return;

    try {
      setIsProcessingPayment(true);
      setPaymentError(null);

      const result = await api.simulatePayment({
        order_id: createdOrder.id,
        payment_method: paymentMethod,
        upi_vpa: paymentMethod === 'UPI' ? upiVpa : undefined,
        card_number: paymentMethod === 'CARD' ? cardNumber : undefined,
        card_expiry: paymentMethod === 'CARD' ? cardExpiry : undefined,
        card_cvv: paymentMethod === 'CARD' ? cardCvv : undefined,
        simulate_failure: simulateFailure,
      });

      setPaymentResult(result);

      if (result.status === 'SUCCESS' || result.status === 'PENDING') {
        setCurrentStep(6); // Step 6: Confirmation
      } else {
        setPaymentError(result.error_message || 'Payment simulation failed.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment simulation error.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!cart && currentStep < 5) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <button
          onClick={onBackToShopping}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-8 animate-fade-in">
      {/* Top Breadcrumb Steps */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <button
          onClick={onBackToShopping}
          className="text-xs font-bold text-stone-600 hover:text-emerald-800 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </button>
        <span className="text-xs font-bold text-emerald-800">
          Step {currentStep} of 6: {
            currentStep === 1 ? 'Confirm Cart' :
            currentStep === 2 ? 'Delivery Address' :
            currentStep === 3 ? 'Delivery Slot' :
            currentStep === 4 ? 'Review & Summary' :
            currentStep === 5 ? 'Demo Payment' : 'Order Confirmed'
          }
        </span>
      </div>

      {checkoutError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Order Placement Issue</p>
            <p className="text-xs mt-0.5">{checkoutError}</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 1: Confirm Cart Items */}
      {/* ======================================================== */}
      {currentStep === 1 && cart && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">Step 1: Confirm Fresh Harvest Items</h2>
              <p className="text-xs text-stone-500">Check your vegetables, fruits, and quantities</p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              {cart.item_count} Items
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {cart.items.map((ci) => (
              <div key={ci.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={ci.product.image_url}
                    alt={ci.product.name}
                    className="w-14 h-14 rounded-xl object-cover border border-stone-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{ci.product.name}</h4>
                    <p className="text-xs text-stone-500">
                      {ci.quantity} {ci.product.unit_type} × ₹{ci.product.price_per_unit}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      From: {ci.product.merchant_farm || ci.product.merchant_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-stone-900">₹{ci.line_total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-950">Subtotal</span>
            <span className="text-xl font-extrabold text-emerald-800">₹{cart.subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition flex items-center gap-2"
            >
              Continue to Delivery Address <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: Delivery Address Selection */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Step 2: Confirm Delivery Address</h2>
            <p className="text-xs text-stone-500">Where should our local farm courier arrive?</p>
          </div>

          {selectedAddress ? (
            <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-200 text-emerald-900">
                  {selectedAddress.label} Address
                </span>
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" /> Selected for Delivery
                </span>
              </div>
              <p className="text-sm font-bold text-stone-900">{selectedAddress.recipient_name} ({selectedAddress.mobile})</p>
              <p className="text-xs text-stone-600">{selectedAddress.address_line}</p>
              <p className="text-xs font-medium text-emerald-900">
                {selectedAddress.village_town}, {selectedAddress.district}, {selectedAddress.state} - {selectedAddress.pincode}
              </p>
            </div>
          ) : (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
              <MapPin className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="text-sm font-bold text-stone-800">No Delivery Address Selected</p>
              <p className="text-xs text-stone-600">Please choose or enter your address to proceed.</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="py-3 px-6 bg-stone-100 text-stone-700 font-bold text-sm rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!selectedAddress}
              className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
            >
              Continue to Delivery Slot <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: Delivery Slot Selection */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Step 3: Choose Preferred Delivery Slot</h2>
            <p className="text-xs text-stone-500">Pick the best time for your fresh delivery</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {deliverySlots.map((slot) => {
              const isSelected = selectedSlot.includes(slot.time);
              return (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlot(`${slot.title} (${slot.time})`)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                      : 'border-stone-200 hover:border-emerald-300 bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">{slot.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-sm font-extrabold text-stone-900">{slot.time}</p>
                  <p className="text-[11px] text-stone-500">{slot.desc}</p>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Delivery Instructions for Farmer / Courier (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave at front veranda, call on arrival, etc."
              className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-3 px-6 bg-stone-100 text-stone-700 font-bold text-sm rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition flex items-center gap-2"
            >
              Review Order Totals <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: Review Order Totals & Confirm */}
      {/* ======================================================== */}
      {currentStep === 4 && cart && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Step 4: Review Item Totals & Delivery</h2>
            <p className="text-xs text-stone-500">Verify full calculation before placing order</p>
          </div>

          {/* Breakdown Card */}
          <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex justify-between text-sm text-stone-600">
              <span>Items Total ({cart.item_count} items)</span>
              <span className="font-semibold text-stone-900">₹{cart.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm text-stone-600">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700" />
                Delivery Fee
              </span>
              <span className="font-semibold text-stone-900">
                {cart.delivery_fee === 0 ? (
                  <span className="text-emerald-700 font-bold">FREE</span>
                ) : (
                  `₹${cart.delivery_fee.toFixed(2)}`
                )}
              </span>
            </div>

            {cart.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-700 font-semibold">
                <span>Promotional Discount</span>
                <span>-₹{cart.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-stone-200 pt-3 flex justify-between text-xl font-black text-stone-900">
              <span>Final Payable Amount</span>
              <span className="text-emerald-700">₹{cart.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-0.5">
              <p className="font-bold">Delivery Location & Slot:</p>
              <p>{selectedAddress?.address_line}, {selectedAddress?.village_town}, {selectedAddress?.district}</p>
              <p className="text-emerald-800 font-semibold">Slot: {selectedSlot}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(3)}
              className="py-3 px-6 bg-stone-100 text-stone-700 font-bold text-sm rounded-xl"
            >
              Back
            </button>
            <button
              onClick={handleProceedToPayment}
              disabled={isCheckingOut}
              className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
            >
              {isCheckingOut ? 'Creating Order...' : 'Proceed to Demo Payment'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 5: Demo Payment Simulator */}
      {/* ======================================================== */}
      {currentStep === 5 && createdOrder && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl space-y-6">
          {/* Prominent Demo Payment Disclaimer Banner */}
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0" />
            <div>
              <h3 className="text-sm font-extrabold text-amber-950 tracking-wide">
                DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                This simulator demonstrates real-world payment flows (UPI, Card, COD) with instant success or failure testing.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <p className="text-xs text-stone-500 font-medium">Order Number:</p>
              <p className="text-base font-extrabold text-stone-900">{createdOrder.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500 font-medium">Total Payable:</p>
              <p className="text-2xl font-black text-emerald-700">₹{createdOrder.total_amount.toFixed(2)}</p>
            </div>
          </div>

          {paymentError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Payment Simulation Notice</p>
                <p className="mt-0.5">{paymentError}</p>
              </div>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Select Demo Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                    : 'border-stone-200 hover:border-emerald-300 text-stone-600'
                }`}
              >
                <Smartphone className="w-6 h-6 text-emerald-600" />
                <span className="text-xs">UPI Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'CARD'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                    : 'border-stone-200 hover:border-emerald-300 text-stone-600'
                }`}
              >
                <CreditCard className="w-6 h-6 text-emerald-600" />
                <span className="text-xs">Credit/Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                    : 'border-stone-200 hover:border-emerald-300 text-stone-600'
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span className="text-xs">Cash on Delivery</span>
              </button>
            </div>
          </div>

          {/* UPI Form */}
          {paymentMethod === 'UPI' && (
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <label className="block text-xs font-bold text-stone-800">Sample UPI ID / VPA</label>
              <input
                type="text"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                placeholder="e.g. name@okhdfcbank"
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-stone-500">
                Simulated UPI apps: Google Pay, PhonePe, Paytm, BHIM.
              </p>
            </div>
          )}

          {/* Card Form */}
          {paymentMethod === 'CARD' && (
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Demo Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">CVV</label>
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* COD Form */}
          {paymentMethod === 'COD' && (
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <p className="text-xs font-bold text-stone-900">Cash on Delivery Demo</p>
              <p className="text-xs text-stone-600 leading-relaxed">
                Pay exact cash of <strong>₹{createdOrder.total_amount.toFixed(2)}</strong> directly to our delivery courier when your fresh harvest parcel arrives.
              </p>
            </div>
          )}

          {/* Testing Failure Toggle */}
          <div className="p-3 bg-stone-100 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">
              Test Mode: Simulate Bank Decline / Payment Failure
            </span>
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSimulatePayment}
              disabled={isProcessingPayment}
              className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm text-white shadow-lg transition active:scale-[0.98] ${
                simulateFailure
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isProcessingPayment
                ? 'Processing Demo Transaction...'
                : simulateFailure
                ? `Test Simulate Failed Payment (₹${createdOrder.total_amount})`
                : `Simulate Successful Payment (₹${createdOrder.total_amount})`}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 6: Order Confirmation & Receipt */}
      {/* ======================================================== */}
      {currentStep === 6 && createdOrder && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-12 h-12" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
              Order Confirmed & Placed Successfully!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
              Thank You, {user?.full_name}!
            </h2>
            <p className="text-xs text-stone-500">
              Your farm order has been received by our farmers.
            </p>
          </div>

          {/* Receipt Details Card */}
          <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-left space-y-3 max-w-lg mx-auto">
            <div className="flex justify-between text-xs">
              <span className="text-stone-500 font-medium">Order Number:</span>
              <span className="font-extrabold text-stone-900">{createdOrder.order_number}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-stone-500 font-medium">Demo Payment Ref:</span>
              <span className="font-mono text-emerald-700 font-bold">{paymentResult?.transaction_ref}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-stone-500 font-medium">Payment Status:</span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                {paymentResult?.status || 'CONFIRMED'} (DEMO)
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-stone-500 font-medium">Delivery Slot:</span>
              <span className="font-semibold text-stone-800">{createdOrder.delivery_slot}</span>
            </div>

            <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-black text-stone-900">
              <span>Total Amount Paid:</span>
              <span className="text-emerald-700">₹{createdOrder.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onViewOrders}
              className="w-full sm:w-auto py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition"
            >
              Track Order in "My Orders"
            </button>
            <button
              onClick={onBackToShopping}
              className="w-full sm:w-auto py-3.5 px-6 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl transition"
            >
              Continue Marketplace Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
