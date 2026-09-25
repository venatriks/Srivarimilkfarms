import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Milk, Calendar, Wallet, PauseCircle, PlayCircle, Plus, Minus,
  MapPin, Clock, RefreshCw, CheckCircle, Package, ArrowUpRight, ShieldCheck, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscriptions, toggleSubscriptionPause, updateSubscriptionQty, orders, showToast } = useApp();

  const queryParams = new URLSearchParams(location.search);
  const activeTabParam = queryParams.get('tab');

  useEffect(() => {
    if (!user) {
      showToast("Please log in to view your subscriptions and delivery settings.", "info");
      navigate('/login', { state: { from: location } });
    }
  }, [user, navigate, location]);

  const [wallet, setWallet] = useState(user?.walletBalance || 2450);
  const [rechargeAmount, setRechargeAmount] = useState(1000);
  const [deliveryInstructions, setDeliveryInstructions] = useState("Leave inside insulated doorstep bag outside Flat 402");

  if (!user) return null;

  const handleRecharge = () => {
    setWallet(prev => prev + rechargeAmount);
    showToast(`Added ₹${rechargeAmount} to your Srivari Milk Wallet!`);
  };

  const handleSaveInstructions = (e) => {
    e.preventDefault();
    showToast("Delivery instructions updated for your 5 AM runner!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F3E2E] to-[#18523f] text-white p-8 rounded-3xl border border-[#D4AF37]/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-wider border border-white/20 inline-flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Subscriber</span>
          </span>
          <h1 className="font-serif-display text-3xl font-bold">
            Welcome back, {user?.name || "Anita Sharma"}!
          </h1>
          <p className="text-xs text-emerald-100/90">
            {user?.address || "Flat 402, Green Glen Layout, Bellandur, Bengaluru"}
          </p>
        </div>

        {/* Wallet Quick Balance Card */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-right w-full md:w-auto flex items-center justify-between md:justify-end space-x-6">
          <div>
            <span className="text-xs text-emerald-200 block">Srivari Wallet Balance</span>
            <span className="text-3xl font-bold font-serif-display text-white">₹{wallet}</span>
          </div>
          <button
            onClick={handleRecharge}
            className="px-4 py-2.5 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors shadow-md"
          >
            + Recharge
          </button>
        </div>
      </div>

      {/* Main Grid: Subscriptions & Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 2 Cols: Active Subscriptions Manager */}
        <div className="lg:col-span-2 space-y-6">

          <div className="flex items-center justify-between">
            <h2 className="font-serif-display text-2xl font-bold text-[#0F3E2E] flex items-center space-x-2">
              <Milk className="w-6 h-6 text-[#D4AF37]" />
              <span>Your Daily Milk Subscriptions</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">Next Dispatch: Tomorrow, 5:30 AM</span>
          </div>

          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className={`bg-white rounded-3xl p-6 border shadow-md transition-all space-y-6 ${
                sub.status === 'Active' ? 'border-[#0F3E2E]/20' : 'border-amber-300 bg-amber-50/40'
              }`}
            >

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    sub.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {sub.status === 'Active' ? 'Active Dispatch' : 'Vacation Paused'}
                  </span>
                  <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E] mt-1">
                    {sub.productName}
                  </h3>
                </div>

                {/* Pause / Resume Action */}
                <button
                  onClick={() => toggleSubscriptionPause(sub.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                    sub.status === 'Active'
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      : 'bg-[#0F3E2E] text-white hover:bg-[#18523f]'
                  }`}
                >
                  {sub.status === 'Active' ? (
                    <>
                      <PauseCircle className="w-4 h-4" />
                      <span>Pause Delivery</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 text-[#D4AF37]" />
                      <span>Resume Delivery</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quantity & Details Control */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">

                {/* Quantity modifier */}
                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-2">
                  <span className="text-stone-500 font-medium">Daily Quantity</span>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => updateSubscriptionQty(sub.id, Math.max(1, sub.quantity - 1))}
                      className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-lg font-bold text-[#0F3E2E]">
                      {sub.quantity} {sub.unit}s
                    </span>
                    <button
                      onClick={() => updateSubscriptionQty(sub.id, sub.quantity + 1)}
                      className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Time slot */}
                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-stone-500 font-medium">Morning Delivery Slot</span>
                  <p className="font-bold text-[#0F3E2E] text-sm">{sub.deliverySlot}</p>
                  <p className="text-[10px] text-emerald-700">Glass bottle doorstep drop</p>
                </div>

                {/* Price calculation */}
                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-stone-500 font-medium">Daily Amount</span>
                  <p className="font-bold text-[#0F3E2E] text-sm">₹{sub.pricePerDay} / day</p>
                  <p className="text-[10px] text-stone-500">Auto-deducted from wallet</p>
                </div>

              </div>

              {/* Glass Bottle Recycling Tracker */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-[#D4AF37]/30 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <div>
                    <span className="font-bold text-[#0F3E2E]">Glass Bottles Exchanged: {sub.bottlesExchanged} Bottles</span>
                    <p className="text-[11px] text-stone-600">Total Cashback Earned: ₹{(sub.bottlesExchanged * 5)}</p>
                  </div>
                </div>
              </div>

            </div>
          ))}

          {/* Order History */}
          <div className="bg-white rounded-3xl p-6 border border-[#0F3E2E]/10 shadow-md space-y-4">
            <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E] flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#D4AF37]" />
              <span>Recent Delivery Orders</span>
            </h3>

            <div className="divide-y divide-stone-100 text-xs">
              {orders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#0F3E2E]">{ord.id}</span>
                    <span className="text-stone-500 text-[11px] block">{ord.date} • {ord.deliverySlot}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#0F3E2E]">₹{ord.totalAmount}</span>
                    <span className="text-emerald-700 text-[10px] font-bold block">{ord.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col: Wallet Recharge & Delivery Preferences */}
        <div className="space-y-6">

          {/* Quick Wallet Top Up Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-4">
            <h3 className="font-serif-display text-lg font-bold text-[#0F3E2E] flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-[#D4AF37]" />
              <span>Recharge Srivari Wallet</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setRechargeAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    rechargeAmount === amt
                      ? 'bg-[#0F3E2E] text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleRecharge}
              className="w-full py-3 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-all shadow-md"
            >
              Add ₹{rechargeAmount} to Wallet
            </button>

            <p className="text-[11px] text-stone-500 text-center">
              Wallet money never expires. Auto-refills your morning milk subscription seamlessly!
            </p>
          </div>

          {/* Delivery Instructions */}
          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-4">
            <h3 className="font-serif-display text-lg font-bold text-[#0F3E2E] flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              <span>5 AM Delivery Note</span>
            </h3>

            <form onSubmit={handleSaveInstructions} className="space-y-3">
              <textarea
                rows={3}
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold hover:bg-[#18523f] transition-all"
              >
                Update Instructions
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
