import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Wallet,
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  Sparkles,
  User,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export const CheckoutModal = () => {
  const {
    checkoutOpen,
    setCheckoutOpen,
    cart,
    cartTotal,
    user,
    placeOrder,
    showToast,
    clearCart
  } = useApp();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 ');
  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState(user ? 'wallet' : 'upi');
  const [deliverySlot, setDeliverySlot] = useState('5:30 AM - 6:30 AM');
  const [instructions, setInstructions] = useState(
    'Ring bell gently / Leave inside insulated doorstep bag.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Sync customer details whenever the user or modal changes
  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerEmail(user.email || '');
      setPhone(user.phone || '+91 ');
      setAddress(user.address || '');
      setPaymentMethod('upi');
    }

    setSubmitError('');
  }, [user, checkoutOpen]);

  if (!checkoutOpen) return null;

  const hasSubscriptionItem = cart.some(
    (item) => item.buyType === 'subscription'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitError('');

    // -----------------------------
    // Basic validation
    // -----------------------------

    if (!customerName.trim()) {
      showToast('Please enter your full name for delivery', 'error');
      return;
    }

    if (!customerEmail.trim()) {
      showToast('Please enter your email address for order receipt', 'error');
      return;
    }

    if (!phone.trim() || phone.trim() === '+91') {
      showToast('Please enter a valid contact phone number', 'error');
      return;
    }

    if (!address.trim()) {
      showToast('Please enter complete delivery address', 'error');
      return;
    }

    if (!cart || cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    // -----------------------------
    // Guest cannot purchase
    // subscription items
    // -----------------------------

    if (hasSubscriptionItem && !user) {
      showToast(
        'Subscriptions require an account. Please sign in or convert cart items to one-time delivery.',
        'error'
      );
      return;
    }

    // -----------------------------
    // Convert payment method
    // -----------------------------

    const formattedPaymentMethod =
      paymentMethod === 'wallet'
        ? 'Srivari Wallet'
        : paymentMethod === 'upi'
          ? 'UPI Instant Pay'
          : 'Cash on Delivery'
    // -----------------------------
    // Prepare items for Supabase RPC
    // -----------------------------
    //
    // IMPORTANT:
    // We send product_id + quantity only.
    //
    // The database function will:
    // - verify the product exists
    // - verify stock
    // - read the trusted price
    // - calculate the total
    // - create the order
    //
    // This prevents the browser from changing
    // the order total or product price.
    // -----------------------------

    const rpcItems = cart.map((item) => ({
      product_id: String(
        item.productId ||
        item.product_id ||
        item.id
      ),
      quantity: Number(item.quantity || 1)
    }));

    // Validate product IDs before sending
    const invalidItem = rpcItems.find(
      (item) =>
        !item.product_id ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    );

    if (invalidItem) {
      showToast(
        'One or more cart items are invalid. Please refresh your cart and try again.',
        'error'
      );
      return;
    }

    try {
      setSubmitting(true);

      // =====================================================
      // GUEST / ONE-TIME ORDER
      // =====================================================
      //
      // All one-time orders go through the secure Supabase RPC.
      // No direct INSERT into one_time_orders is performed here.
      // =====================================================

      const { data, error } = await supabase.rpc(
        'create_one_time_order',
        {
          p_customer_name: customerName.trim(),
          p_customer_email: customerEmail.trim().toLowerCase(),
          p_customer_phone: phone.trim(),
          p_address: address.trim(),
          p_items: rpcItems,
          p_delivery_slot: deliverySlot,
          p_instructions: instructions.trim() || null,
          p_payment_method: formattedPaymentMethod
        }
      );

      if (error) {
        console.error('One-time order creation failed:', error);
        throw error;
      }

      // Supabase returns the created order row.
      const createdOrder = Array.isArray(data) ? data[0] : data;

      console.log('One-time order created successfully:', createdOrder);

      // -----------------------------------------------------
      // Clear the shopping cart
      // -----------------------------------------------------

      if (typeof clearCart === 'function') {
        clearCart();
      }

      // -----------------------------------------------------
      // Close checkout
      // -----------------------------------------------------

      setCheckoutOpen(false);

      // -----------------------------------------------------
      // Success message
      // -----------------------------------------------------

      const orderId = createdOrder?.id || 'Order';

      showToast(
        `${orderId} confirmed successfully! Your order will be prepared for morning delivery.`,
        'success'
      );
    } catch (error) {
      console.error('Checkout error:', error);

      const message =
        error?.message ||
        'Unable to place your order. Please try again.';

      setSubmitError(message);

      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#FDFBF7] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#D4AF37]/40 relative my-8">

        {/* Header */}
        <div className="bg-[#0F3E2E] text-white p-6 relative border-b border-[#D4AF37]/30">

          <button
            onClick={() => setCheckoutOpen(false)}
            disabled={submitting}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>5 AM Morning Fresh Dispatch</span>
          </div>

          <h3 className="font-serif-display text-2xl font-bold text-white">
            {user
              ? 'Checkout & Order Confirmation'
              : 'Guest Checkout (No Login Required)'}
          </h3>

          <p className="text-xs text-emerald-100/80 mt-1">
            {user
              ? 'Review delivery details and choose your preferred payment mode'
              : 'Order pure A2 dairy products for one-time delivery without creating an account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Guest Checkout Banner */}
          {!user && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-[#D4AF37]/40 flex items-start space-x-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-[#0F3E2E] shrink-0 mt-0.5" />

              <div>
                <span className="font-bold text-[#0F3E2E] block">
                  One-Time Order Guest Purchase
                </span>

                <span className="text-stone-600">
                  No login required for one-time purchases! Enter your delivery
                  details below to receive fresh farm dispatch tomorrow morning.
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-xs">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />

              <div>
                <p className="font-bold text-red-700">
                  Unable to place order
                </p>

                <p className="text-red-600 mt-1">
                  {submitError}
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Customer & Delivery Details */}
          <div className="space-y-4">

            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F3E2E] flex items-center space-x-2">
              <User className="w-4 h-4 text-[#D4AF37]" />
              <span>1. Customer & Delivery Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Customer Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">
                  Full Name *
                </label>

                <div className="relative">
                  <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Customer Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">
                  Email Address (for Order Receipt) *
                </label>

                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">
                  Contact Phone Number *
                </label>

                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Morning Slot */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">
                  Morning Time Slot *
                </label>

                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                >
                  <option value="5:00 AM - 6:00 AM">
                    5:00 AM - 6:00 AM (Early Rise)
                  </option>

                  <option value="5:30 AM - 6:30 AM">
                    5:30 AM - 6:30 AM (Standard)
                  </option>

                  <option value="6:30 AM - 7:30 AM">
                    6:30 AM - 7:30 AM (Morning)
                  </option>
                </select>
              </div>

              {/* Complete Address */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-stone-600">
                  Complete Delivery Address *
                </label>

                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />

                  <input
                    type="text"
                    required
                    placeholder="Flat / House No, Building / Layout, Area, City & Pincode"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-stone-600">
                  Runner Delivery Instructions
                </label>

                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"
                  placeholder="e.g. Ring bell gently / Leave inside doorstep bag"
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

              {/* Wallet */}
              <label
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${!user
                  ? 'opacity-50 cursor-not-allowed bg-stone-100 border-stone-200'
                  : paymentMethod === 'wallet'
                    ? 'bg-[#0F3E2E]/10 border-[#0F3E2E] shadow-sm cursor-pointer'
                    : 'bg-white border-stone-200 hover:border-stone-300 cursor-pointer'
                  }`}
              >
                <div className="flex items-center justify-between">

                  <span className="text-xs font-bold text-[#0F3E2E]">
                    Srivari Wallet
                  </span>

                  <input
                    type="radio"
                    name="pay"
                    disabled
                    checked={false}
                    className="accent-[#0F3E2E]"
                  />
                </div>
                <span className="text-[11px] text-emerald-800 font-semibold mt-2">
                  Wallet payment coming soon
                </span>

                <span className="text-[11px] text-emerald-800 font-semibold mt-2">
                  {user
                    ? `Balance: ₹${user.walletBalance || 0}`
                    : 'Requires Customer Login'}
                </span>
              </label>

              {/* UPI */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === 'upi'
                  ? 'bg-[#0F3E2E]/10 border-[#0F3E2E] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
              >
                <div className="flex items-center justify-between">

                  <span className="text-xs font-bold text-[#0F3E2E]">
                    UPI / QR Pay
                  </span>

                  <input
                    type="radio"
                    name="pay"
                    disabled={submitting}
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-[#0F3E2E]"
                  />
                </div>

                <span className="text-[11px] text-stone-500 mt-2">
                  GPay / PhonePe / Paytm
                </span>
              </label>

              {/* Cash on Delivery */}
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === 'cod'
                  ? 'bg-[#0F3E2E]/10 border-[#0F3E2E] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
              >
                <div className="flex items-center justify-between">

                  <span className="text-xs font-bold text-[#0F3E2E]">
                    Pay on Delivery
                  </span>

                  <input
                    type="radio"
                    name="pay"
                    disabled={submitting}
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-[#0F3E2E]"
                  />
                </div>

                <span className="text-[11px] text-stone-500 mt-2">
                  Cash or QR Code on Door Step
                </span>
              </label>

            </div>
          </div>

          {/* Section 3: Summary */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-[#D4AF37]/30 space-y-2 text-xs">

            <div className="flex justify-between font-bold text-[#0F3E2E]">
              <span>Items Total ({cart.length} items)</span>
              <span>₹{cartTotal}</span>
            </div>

            <div className="flex justify-between text-emerald-800">
              <span>Chilled Doorstep Morning Delivery</span>
              <span className="font-bold">FREE</span>
            </div>

            <div className="flex justify-between text-stone-700 pt-2 border-t border-amber-200 text-sm font-bold">
              <span>Total Payable Amount</span>
              <span className="text-[#0F3E2E] text-base">
                ₹{cartTotal}
              </span>
            </div>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#0F3E2E] text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-[#18523f] shadow-xl border border-[#D4AF37]/30 transition-transform active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Truck className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                <span>Placing Your Order...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                <span>Confirm Order & Schedule Delivery</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};