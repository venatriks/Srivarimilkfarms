import React, { useState } from 'react';
import { X, CheckCircle, Wallet, CreditCard, Truck, ShieldCheck, MapPin, Phone, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CheckoutModal = () => {
  const { checkoutOpen, setCheckoutOpen, cart, cartTotal, user, placeOrder } = useApp();
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [deliverySlot, setDeliverySlot] = useState('5:30 AM - 6:30 AM');
  const [address, setAddress] = useState(user?.address || "Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103");
  const [phone, setPhone] = useState(user?.phone || "+91 98765 43210");
  const [instructions, setInstructions] = useState('Ring bell gently / Leave inside insulated doorstep bag.');

  if (!checkoutOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    placeOrder({ method: paymentMethod === 'wallet' ? 'Srivari Wallet' : paymentMethod === 'upi' ? 'UPI Instant Pay' : 'Pay on Morning Delivery' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#FDFBF7] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#D4AF37]/40 relative my-8">
        
        {/* Header */}
        <div className="bg-[#0F3E2E] text-white p-6 relative border-b border-[#D4AF37]/30">
          <button
            onClick={() => setCheckoutOpen(false)}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>5 AM Morning Fresh Dispatch</span>
          </div>

          <h3 className="font-serif-display text-2xl font-bold text-white">
            Checkout & Order Confirmation
          </h3>
          <p className="text-xs text-emerald-100/80 mt-1">
            Review delivery details and choose your preferred payment mode
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Delivery Address & Slot */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F3E2E] flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span>1. Doorstep Delivery Location</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-stone-600">Complete Delivery Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Contact Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">Morning Time Slot</label>
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                >
                  <option value="5:00 AM - 6:00 AM">5:00 AM - 6:00 AM (Early Rise)</option>
                  <option value="5:30 AM - 6:30 AM">5:30 AM - 6:30 AM (Standard)</option>
                  <option value="6:30 AM - 7:30 AM">6:30 AM - 7:30 AM (Morning)</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-stone-600">Runner Delivery Instructions</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  placeholder="e.g. Leave in milk bag outside apartment"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F3E2E] flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-[#D4AF37]" />
              <span>2. Select Payment Mode</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Wallet Option */}
              <label 
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'wallet'
                    ? 'bg-[#0F3E2E]/10 border-[#0F3E2E] shadow-sm'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F3E2E]">Srivari Wallet</span>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="accent-[#0F3E2E]"
                  />
                </div>
                <span className="text-[11px] text-emerald-800 font-semibold mt-2">
                  Balance: ₹{user?.walletBalance || 2450}
                </span>
              </label>

              {/* UPI Option */}
              <label 
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'upi'
                    ? 'bg-[#0F3E2E]/10 border-[#0F3E2E] shadow-sm'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F3E2E]">UPI / QR</span>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-[#0F3E2E]"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-2">GPay / PhonePe / Paytm</span>
              </label>

              {/* Cash / Bottle Return */}
              <label 
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'cod'
                    ? 'bg-[#0F3E2E]/10 border-[#0F3E2E] shadow-sm'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F3E2E]">Pay on Delivery</span>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-[#0F3E2E]"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-2">Cash or Bottle Return</span>
              </label>

            </div>
          </div>

          {/* Section 3: Summary Box */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-[#D4AF37]/30 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-[#0F3E2E]">
              <span>Items Total ({cart.length} items)</span>
              <span>₹{cartTotal}</span>
            </div>
            <div className="flex justify-between text-emerald-800">
              <span>Chilled Doorstep Delivery</span>
              <span className="font-bold">FREE</span>
            </div>
            <div className="flex justify-between text-stone-700 pt-2 border-t border-amber-200 text-sm font-bold">
              <span>Payable Amount</span>
              <span className="text-[#0F3E2E] text-base">₹{cartTotal}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-[#0F3E2E] text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-[#18523f] shadow-xl border border-[#D4AF37]/30 transition-transform active:scale-98 flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
            <span>Confirm Order & Schedule Morning Delivery</span>
          </button>

        </form>
      </div>
    </div>
  );
};
