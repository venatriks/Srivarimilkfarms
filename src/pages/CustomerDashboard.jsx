import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Milk,
  Package,
  PauseCircle,
  PlayCircle,
  Plus,
  Minus,
  RefreshCw,
  Wallet,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().split('T')[0];
};

const getUnitLabel = (product) => {
  if (!product?.unit) return 'Liter';
  return String(product.unit).replace(/^1\s*/i, '').trim() || 'Liter';
};

export const CustomerDashboard = () => {
  const navigate = useNavigate();

  const {
    user,
    products = [],
    subscriptions = [],
    orders = [],
    showToast,
    toggleSubscriptionPause,
    updateSubscriptionQty,
  } = useApp();

  const [walletAmount, setWalletAmount] = useState(
    Number(user?.walletBalance ?? 0)
  );
  const [selectedRecharge, setSelectedRecharge] = useState(1000);
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    'Leave inside insulated doorstep bag outside Flat 402'
  );
  const [savingSubscriptionId, setSavingSubscriptionId] = useState(null);

  /*
   * AppContext intentionally keeps the complete Supabase subscription/order
   * collections available to the application. The customer dashboard must
   * filter them to the authenticated customer before rendering.
   */
  const customerSubscriptions = useMemo(() => {
    if (!user?.id) return [];

    return subscriptions.filter(
      (subscription) => String(subscription.userId || '') === String(user.id)
    );
  }, [subscriptions, user?.id]);

  const customerOrders = useMemo(() => {
    if (!user?.id) return [];

    return orders
      .filter(
        (order) => String(order.userId || '') === String(user.id)
      )
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.date || 0).getTime();
        const bTime = new Date(b.createdAt || b.date || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [orders, user?.id]);

  const getProductForSubscription = (subscription) =>
    products.find(
      (product) => String(product.id) === String(subscription.productId)
    );

  const handlePauseResume = async (subscription) => {
    if (!user?.id || savingSubscriptionId) return;

    const nextStatus =
      subscription.status === 'Active' ? 'Paused' : 'Active';

    setSavingSubscriptionId(subscription.id);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: nextStatus })
          .eq('id', subscription.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Subscription status update error:', error);
          showToast(
            error.message || 'Unable to update subscription status.',
            'error'
          );
          return;
        }
      }

      // Keep the local AppContext state in sync immediately.
      toggleSubscriptionPause(subscription.id);

      showToast(
        nextStatus === 'Active'
          ? 'Subscription resumed successfully.'
          : 'Delivery paused successfully.'
      );
    } catch (error) {
      console.error('Subscription status update exception:', error);
      showToast('Unable to update your subscription right now.', 'error');
    } finally {
      setSavingSubscriptionId(null);
    }
  };

  const handleQuantityChange = async (subscription, newQuantity) => {
    if (!user?.id || savingSubscriptionId) return;

    const quantity = Math.max(1, Number(newQuantity) || 1);
    if (quantity === Number(subscription.quantity)) return;

    const currentQuantity = Math.max(1, Number(subscription.quantity) || 1);
    const currentDailyAmount = Number(subscription.pricePerDay || 0);

    // Preserve the subscription's current per-unit rate instead of
    // hard-coding a milk price in the dashboard.
    const unitPrice =
      currentDailyAmount > 0
        ? currentDailyAmount / currentQuantity
        : Number(getProductForSubscription(subscription)?.price || 0);

    const newDailyAmount = Number((unitPrice * quantity).toFixed(2));

    setSavingSubscriptionId(subscription.id);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            quantity,
            price_per_day: newDailyAmount,
          })
          .eq('id', subscription.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Subscription quantity update error:', error);
          showToast(
            error.message || 'Unable to update subscription quantity.',
            'error'
          );
          return;
        }
      }

      // AppContext updates its local representation immediately.
      updateSubscriptionQty(subscription.id, quantity);

      showToast(`Subscription updated to ${quantity} Liter/day.`);
    } catch (error) {
      console.error('Subscription quantity update exception:', error);
      showToast('Unable to update subscription quantity right now.', 'error');
    } finally {
      setSavingSubscriptionId(null);
    }
  };

  const handleRecharge = () => {
    // Wallet recharge remains a UI action until a secure wallet-payment RPC
    // / payment gateway is connected. Do not pretend that money was charged.
    setWalletAmount((current) => current + selectedRecharge);
    showToast(
      `₹${selectedRecharge} recharge selected. Connect your payment gateway to process the payment.`,
      'info'
    );
  };

  const handleInstructionsSubmit = (event) => {
    event.preventDefault();
    showToast('Delivery instructions updated for your 5 AM runner.');
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl border border-[#0F3E2E]/10 shadow-md p-8 text-center">
          <h1 className="font-serif-display text-2xl font-bold text-[#0F3E2E]">
            Customer Dashboard
          </h1>
          <p className="text-sm text-stone-500 mt-2">
            Please sign in to view your milk subscriptions and delivery orders.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 px-6 py-3 bg-[#0F3E2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-10">
          {/* Subscription heading */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif-display text-2xl font-bold text-[#0F3E2E] flex items-center space-x-2">
              <Milk className="w-6 h-6 text-[#D4AF37]" />
              <span>Your Daily Milk Subscriptions</span>
            </h2>

            <span className="text-xs text-stone-500 font-medium whitespace-nowrap">
              Next Dispatch: Tomorrow, 5:30 AM
            </span>
          </div>

          {/* REAL SUPABASE SUBSCRIPTIONS */}
          {customerSubscriptions.length > 0 ? (
            customerSubscriptions.map((subscription) => {
              const product = getProductForSubscription(subscription);
              const productName =
                subscription.productName ||
                product?.name ||
                'Daily Milk Subscription';

              const unit = getUnitLabel(product);
              const quantity = Math.max(
                1,
                Number(subscription.quantity || 1)
              );
              const isActive = subscription.status === 'Active';
              const bottlesExchanged = Number(
                subscription.bottlesExchanged || 0
              );
              const pricePerDay = Number(
                subscription.pricePerDay || 0
              );

              return (
                <div
                  key={subscription.id}
                  className={`bg-white rounded-3xl p-6 border shadow-md transition-all space-y-6 ${isActive
                      ? 'border-[#0F3E2E]/20'
                      : 'border-amber-300 bg-amber-50/40'
                    }`}
                >
                  {/* Subscription title + pause/resume */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-200 text-amber-900'
                          }`}
                      >
                        {isActive
                          ? 'Active Dispatch'
                          : 'Vacation Paused'}
                      </span>

                      <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E] mt-1">
                        {productName}
                      </h3>
                    </div>

                    <button
                      type="button"
                      disabled={savingSubscriptionId === subscription.id}
                      onClick={() => handlePauseResume(subscription)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 ${isActive
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : 'bg-[#0F3E2E] text-white hover:bg-[#18523f]'
                        }`}
                    >
                      {isActive ? (
                        <>
                          <PauseCircle className="w-4 h-4" />
                          <span>
                            {savingSubscriptionId === subscription.id
                              ? 'Saving...'
                              : 'Pause Delivery'}
                          </span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 text-[#D4AF37]" />
                          <span>
                            {savingSubscriptionId === subscription.id
                              ? 'Saving...'
                              : 'Resume Delivery'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quantity / delivery / price */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-2">
                      <span className="text-stone-500 font-medium">
                        Daily Quantity
                      </span>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={
                            savingSubscriptionId === subscription.id ||
                            quantity <= 1
                          }
                          onClick={() =>
                            handleQuantityChange(
                              subscription,
                              quantity - 1
                            )
                          }
                          className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 disabled:opacity-40"
                          aria-label="Decrease daily quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-lg font-bold text-[#0F3E2E]">
                          {quantity} {unit}
                          {quantity !== 1 ? 's' : ''}
                        </span>

                        <button
                          type="button"
                          disabled={
                            savingSubscriptionId === subscription.id
                          }
                          onClick={() =>
                            handleQuantityChange(
                              subscription,
                              quantity + 1
                            )
                          }
                          className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 disabled:opacity-40"
                          aria-label="Increase daily quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-1">
                      <span className="text-stone-500 font-medium">
                        Morning Delivery Slot
                      </span>

                      <p className="font-bold text-[#0F3E2E] text-sm">
                        {subscription.deliverySlot ||
                          '5:30 AM - 6:30 AM'}
                      </p>

                      <p className="text-[10px] text-emerald-700">
                        Glass bottle doorstep drop
                      </p>
                    </div>

                    <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-1">
                      <span className="text-stone-500 font-medium">
                        Daily Amount
                      </span>

                      <p className="font-bold text-[#0F3E2E] text-sm">
                        ₹{pricePerDay.toFixed(0)} / day
                      </p>

                      <p className="text-[10px] text-stone-500">
                        Auto-deducted from wallet
                      </p>
                    </div>
                  </div>

                  {/* Bottle exchange */}
                  <div className="bg-amber-50 p-4 rounded-2xl border border-[#D4AF37]/30 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <RefreshCw className="w-5 h-5 text-[#D4AF37] shrink-0" />

                      <div>
                        <span className="font-bold text-[#0F3E2E]">
                          Glass Bottles Exchanged:{' '}
                          {bottlesExchanged} Bottles
                        </span>

                        <p className="text-[11px] text-stone-600">
                          Total Cashback Earned: ₹
                          {bottlesExchanged * 5}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* IMPORTANT: the left section no longer collapses when
               Supabase has zero subscription rows. */
            <div className="bg-white rounded-3xl p-6 border border-[#0F3E2E]/10 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                    No Active Subscription
                  </span>

                  <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E] mt-2">
                    Start Your Daily Milk Subscription
                  </h3>

                  <p className="text-sm text-stone-500 mt-2 max-w-xl">
                    Choose your daily quantity and morning delivery schedule
                    to receive fresh milk at your doorstep.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="shrink-0 px-5 py-3 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Subscribe Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Recent orders */}
          <div className="bg-white rounded-3xl p-6 border border-[#0F3E2E]/10 shadow-md space-y-4">
            <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E] flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#D4AF37]" />
              <span>Recent Delivery Orders</span>
            </h3>

            {customerOrders.length > 0 ? (
              <div className="divide-y divide-stone-100 text-xs">
                {customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="font-bold text-[#0F3E2E]">
                        {order.id}
                      </span>

                      <span className="text-stone-500 text-[11px] block">
                        {formatDate(order.createdAt || order.date)} •{' '}
                        {order.deliverySlot || '5:30 AM - 6:30 AM'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-[#0F3E2E]">
                        ₹{Number(order.totalAmount || 0).toFixed(0)}
                      </span>

                      <span className="text-emerald-700 text-[10px] font-bold block">
                        {order.status || 'Confirmed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-stone-500">
                  No delivery orders yet.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="mt-4 text-xs font-bold text-[#0F3E2E] hover:text-[#18523f]"
                >
                  Explore farm products →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Wallet */}
          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-4">
            <h3 className="font-serif-display text-lg font-bold text-[#0F3E2E] flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-[#D4AF37]" />
              <span>Recharge Srivari Wallet</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedRecharge(amount)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${selectedRecharge === amount
                      ? 'bg-[#0F3E2E] text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                >
                  +₹{amount}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRecharge}
              className="w-full py-3 bg-[#D4AF37] text-[#0F3E2E] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-all shadow-md"
            >
              Add ₹{selectedRecharge} to Wallet
            </button>

            <p className="text-[11px] text-stone-500 text-center">
              Current wallet balance: ₹{walletAmount.toFixed(0)}
            </p>
          </div>

          {/* Delivery note */}
          <div className="bg-white p-6 rounded-3xl border border-[#0F3E2E]/10 shadow-md space-y-4">
            <h3 className="font-serif-display text-lg font-bold text-[#0F3E2E] flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              <span>5 AM Delivery Note</span>
            </h3>

            <form onSubmit={handleInstructionsSubmit} className="space-y-3">
              <textarea
                rows={3}
                value={deliveryInstructions}
                onChange={(event) =>
                  setDeliveryInstructions(event.target.value)
                }
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

export default CustomerDashboard;
