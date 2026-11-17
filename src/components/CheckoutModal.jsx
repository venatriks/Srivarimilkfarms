import { API_BASE_URL } from '../lib/apiConfig';

import React, { useState, useEffect, useRef } from 'react';

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
import { loadRazorpay } from '../lib/razorpayCheckout';



const CHECKOUT_API_URL = `${API_BASE_URL}/checkout`;



const checkOneTimePaymentStatus = async (attempt) => {
  if (!attempt?.orderId || !attempt?.key) {
    return null;
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/payments/one-time/status`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: attempt.orderId,
        checkout_key: attempt.key
      }),
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error('Payment status could not be verified.');
  }

  return response.json();
};

const CHECKOUT_ATTEMPT_STORAGE_KEY = 'srivari_checkout_pending_v1';

const CHECKOUT_ATTEMPT_TTL_MS = 24 * 60 * 60 * 1000;



// Only a digest of checkout details is stored, never customer details or a token.

const checkoutFingerprint = async (payload, customerId) => {

  const encoded = new TextEncoder().encode(JSON.stringify({ customerId: customerId || null, payload }));

  const digest = await crypto.subtle.digest('SHA-256', encoded);

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');

};



const readPendingCheckout = () => {

  try {

    const raw = sessionStorage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY);

    if (!raw) return null;

    const attempt = JSON.parse(raw);

    if (typeof attempt?.fingerprint !== 'string' ||

      typeof attempt?.key !== 'string' ||

      !Number.isFinite(attempt?.createdAt) ||

      Date.now() - attempt.createdAt > CHECKOUT_ATTEMPT_TTL_MS ||

      attempt.createdAt > Date.now()) {

      sessionStorage.removeItem(CHECKOUT_ATTEMPT_STORAGE_KEY);

      return null;

    }

    return attempt;

  } catch {

    return null;

  }

};



const savePendingCheckout = (attempt) => {

  sessionStorage.setItem(CHECKOUT_ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));

};



const clearPendingCheckout = () => {

  sessionStorage.removeItem(CHECKOUT_ATTEMPT_STORAGE_KEY);

};



export const CheckoutModal = () => {

  const {

    checkoutOpen,

    setCheckoutOpen,

    cart,

    cartTotal,

    user,

    placeOrder,

    createSubscription,

    showToast,

    clearCart

  } = useApp();



  const [customerName, setCustomerName] = useState(user?.name || '');

  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  const [phone, setPhone] = useState(user?.phone || '+91 ');

  const [address, setAddress] = useState(user?.address || '');

  const [paymentMethod, setPaymentMethod] = useState('upi');

  const [deliverySlot, setDeliverySlot] = useState('5:30 AM - 6:30 AM');

  const [subscriptionStartDate, setSubscriptionStartDate] = useState('');

  const [subscriptionBillingType, setSubscriptionBillingType] = useState('prepaid');

  const [subscriptionPlanDays, setSubscriptionPlanDays] = useState(7);

  const [recurringIntervals, setRecurringIntervals] = useState({});

  const [instructions, setInstructions] = useState(

    'Ring bell gently / Leave inside insulated doorstep bag.'

  );

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState('');

  const attemptRef = useRef(null);

  const completedSubscriptionsRef = useRef(new Map());




  // Recover a previously submitted one-time payment.
  useEffect(() => {
    if (!checkoutOpen) return;

    const pending = readPendingCheckout();

    if (!pending?.orderId || !pending?.key) return;

    let cancelled = false;

    const recover = async () => {
      try {
        const result = await checkOneTimePaymentStatus(pending);

        if (cancelled || !result) return;

        if (result.verified_paid === true) {
          clearPendingCheckout();
          attemptRef.current = null;

          if (typeof clearCart === 'function') {
            clearCart();
          }

          setCheckoutOpen(false);

          showToast(
            'Your previous payment is verified. Order confirmed!',
            'success'
          );
        } else {
          showToast(
            'Your previous online order is not yet confirmed as paid. ' +
            'Please check its payment status before placing another order.',
            'error'
          );
        }
      } catch {
        if (!cancelled) {
          showToast(
            'Unable to verify your previous payment. ' +
            'Please contact support before placing another order.',
            'error'
          );
        }
      }
    };

    recover();

    return () => {
      cancelled = true;
    };
  }, [checkoutOpen]);

  // Sync customer details whenever the user or modal changes

  useEffect(() => {

    if (user) {

      setCustomerName(user.name || '');

      setCustomerEmail(user.email || '');

      setPhone(user.phone || '+91 ');

      setAddress(user.address || '');

      setPaymentMethod('upi');

    }



    if (!checkoutOpen) {

      completedSubscriptionsRef.current.clear();

    }

    setSubmitError('');

  }, [user, checkoutOpen]);



  if (!checkoutOpen) return null;



  const isRecurringItem = (item) =>

    ['p2', 'p3', 'p5'].includes(

      String(item.productId || item.product_id || item.product?.id || item.id)

    );



  const subscriptionCartItems = cart.filter(

    (item) => item.buyType === 'subscription'

  );



  const hasSubscriptionItem = subscriptionCartItems.length > 0;

  const hasLegacySubscription = subscriptionCartItems.some(

    (item) => !isRecurringItem(item)

  );

  const hasRecurringSubscription = subscriptionCartItems.some(isRecurringItem);



  const handleSubmit = async (e) => {

    e.preventDefault();






    setSubmitError('');



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



    const subscriptionItems = cart.filter(

      (item) => item.buyType === 'subscription'

    );



    const oneTimeItems = cart.filter(

      (item) => item.buyType !== 'subscription'

    );



    if (subscriptionItems.length > 0 && !user) {

      showToast(

        'Subscriptions require an account. Please sign in before starting a subscription.',

        'error'

      );

      return;

    }



    if (subscriptionItems.length > 0) {

      const todayInIndia = new Intl.DateTimeFormat('en-CA', {

        timeZone: 'Asia/Kolkata',

        year: 'numeric',

        month: '2-digit',

        day: '2-digit'

      }).format(new Date());



      if (

        !/^\d{4}-\d{2}-\d{2}$/.test(subscriptionStartDate) ||

        subscriptionStartDate < todayInIndia

      ) {

        showToast(

          'Please select a valid subscription start date (today or later).',

          'error'

        );

        return;

      }

    }



    const formattedPaymentMethod = paymentMethod === 'upi'

      ? 'Razorpay'

      : 'Cash on Delivery';



    try {

      setSubmitting(true);



      const createdSubscriptions = [];



      // -----------------------------------------------------

      // Create real Supabase subscription rows for subscription items

      // -----------------------------------------------------

      for (const [index, item] of subscriptionItems.entries()) {

        const recurring = isRecurringItem(item);

        const interval = recurringIntervals[index] || '';

        const subscriptionKey = `${index}:${JSON.stringify(item)}:${subscriptionStartDate}:${deliverySlot}:${recurring ? 'prepaid' : subscriptionBillingType}:${recurring ? interval : subscriptionPlanDays}`;

        if (completedSubscriptionsRef.current.has(subscriptionKey)) {

          createdSubscriptions.push(completedSubscriptionsRef.current.get(subscriptionKey));

          continue;

        }



        const createdSubscription = await createSubscription({

          item: {

            ...item,

            frequency: recurring ? interval : item.frequency,

            startDate: subscriptionStartDate,

            billingType: recurring ? 'prepaid' : subscriptionBillingType,

            planDays: recurring ? null : subscriptionPlanDays

          },

          deliverySlot

        });



        if (!createdSubscription) {

          throw new Error(

            'Unable to create the milk subscription. Please check the error message and try again.'

          );

        }



        completedSubscriptionsRef.current.set(subscriptionKey, createdSubscription);

        createdSubscriptions.push(createdSubscription);

      }



      // -----------------------------------------------------

      // Create a secure one-time order only for one-time items

      // -----------------------------------------------------

      let createdOrder = null;



      if (oneTimeItems.length > 0) {

        const rpcItems = oneTimeItems.map((item) => ({

          product_id: String(

            item.productId ||

            item.product_id ||

            item.id

          ),

          quantity: Number(item.quantity || 1)

        }));



        const invalidItem = rpcItems.find(

          (item) =>

            !item.product_id ||

            !Number.isInteger(item.quantity) ||

            item.quantity <= 0

        );



        if (invalidItem) {

          throw new Error(

            'One or more one-time cart items are invalid. Please refresh your cart and try again.'

          );

        }



        const orderPayload = {

          p_customer_name: customerName.trim(),

          p_customer_email: customerEmail.trim().toLowerCase(),

          p_customer_phone: phone.trim(),

          p_address: address.trim(),

          p_items: rpcItems,

          p_delivery_slot: deliverySlot,

          p_instructions: instructions.trim() || null,

          p_payment_method: formattedPaymentMethod

        };

        const fingerprint = await checkoutFingerprint(orderPayload, user?.id);

        const pendingAttempt = attemptRef.current || readPendingCheckout();

        // Keep the original idempotency key for recovery.
        // Do not create a fresh order after the payment window expires.
        if (
          paymentMethod === 'upi' &&
          pendingAttempt?.fingerprint === fingerprint &&
          Number.isFinite(pendingAttempt.createdAt) &&
          Date.now() - pendingAttempt.createdAt >= 15 * 60 * 1000
        ) {
          throw new Error(
            'The 15-minute online payment window has expired. ' +
            'Please contact support to confirm the existing order ' +
            'before placing another order.'
          );
        }


        if (
          paymentMethod === 'upi' &&
          pendingAttempt?.orderId &&
          pendingAttempt.fingerprint !== fingerprint
        ) {
          throw new Error(
            'A previous online order still requires payment verification. ' +
            'Please contact support before changing your checkout.'
          );
        }

        if (pendingAttempt?.fingerprint === fingerprint &&

          Date.now() - pendingAttempt.createdAt <= CHECKOUT_ATTEMPT_TTL_MS) {

          attemptRef.current = pendingAttempt;

        } else {

          attemptRef.current = {

            fingerprint,

            key: crypto.randomUUID(),

            createdAt: Date.now()

          };

        }

        // Persist before contacting the server: a lost response or page refresh

        // must not turn the same checkout into a second order.

        savePendingCheckout(attemptRef.current);

        if (
          paymentMethod === 'upi' &&
          attemptRef.current?.orderId
        ) {
          let previousStatus = null;

          try {
            previousStatus = await checkOneTimePaymentStatus(
              attemptRef.current
            );
          } catch {
            throw new Error(
              'Unable to verify your previous online order. ' +
              'Please contact support before retrying.'
            );
          }

          if (previousStatus?.verified_paid === true) {
            throw new Error(
              'Your previous order is already paid. ' +
              'Please check your order history.'
            );
          }

          throw new Error(
            'An existing online order is awaiting payment confirmation. ' +
            'Please contact support before placing another order.'
          );
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw new Error('Unable to verify your session. Please retry.');

        if (user && !sessionData?.session?.access_token) {

          throw new Error('Your session has expired. Please sign in again.');

        }

        const requestHeaders = { 'Content-Type': 'application/json' };

        if (sessionData?.session?.access_token) {

          requestHeaders.Authorization = `Bearer ${sessionData.session.access_token}`;

        }

        let response;

        try {

          response = await fetch(CHECKOUT_API_URL, {

            method: 'POST',

            headers: requestHeaders,

            body: JSON.stringify({

              ...orderPayload,

              p_idempotency_key: attemptRef.current.key

            })

          });

        } catch {

          throw new Error(

            'Checkout connection failed. Your order may have been placed. Please check your orders before trying again.'

          );

        }

        let result;

        try { result = await response.json(); } catch { result = null; }

        if (!response.ok || !result?.success) {

          throw new Error(result?.error || 'Unable to place order. Please retry.');

        }

        const data = result.order;

        createdOrder = Array.isArray(data) ? data[0] : data;

        if (!createdOrder) throw new Error('Checkout returned no order. Please retry.');

        if (paymentMethod === 'upi') {
          if (!createdOrder.id) {
            throw new Error(
              'Missing order reference. Please contact support.'
            );
          }

          attemptRef.current = {
            ...attemptRef.current,
            orderId: String(createdOrder.id)
          };

          savePendingCheckout(attemptRef.current);

          const payment = result.razorpay;

          if (
            !payment?.key_id ||
            !/^order_[A-Za-z0-9]+$/.test(payment.order_id || '') ||
            !Number.isSafeInteger(Number(payment.amount_paise)) ||
            Number(payment.amount_paise) < 100 ||
            payment.currency !== 'INR'
          ) {
            throw new Error(
              'Payment order is unavailable. Your order may already exist. Please contact support before placing another order.'
            );
          }

          await loadRazorpay();

          const paymentResult = await new Promise((resolve, reject) => {
            try {
              const checkout = new window.Razorpay({
                key: payment.key_id,
                order_id: payment.order_id,
                amount: Number(payment.amount_paise),
                currency: 'INR',
                name: 'Srivari Milk Farms',
                description: 'One-time dairy order',
                prefill: {
                  name: customerName.trim(),
                  email: customerEmail.trim(),
                  contact: phone.trim()
                },
                theme: {
                  color: '#0F3E2E'
                },
                handler: () => resolve('submitted'),
                modal: {
                  ondismiss: () => resolve('dismissed')
                }
              });

              checkout.on('payment.failed', () => {
                resolve('failed');
              });

              checkout.open();
            } catch (error) {
              reject(error);
            }
          });

          if (paymentResult !== 'submitted') {
            showToast(
              'Payment not completed. Your order is pending payment.',
              'error'
            );
            return;
          }

          // Browser callback is not proof of payment.
          // Only the backend's settled status confirms payment.
          const orderId = createdOrder.id;
          const checkoutKey = attemptRef.current?.key;

          if (!orderId || !checkoutKey) {
            showToast(
              'Payment submitted. Please contact support to verify your order.',
              'error'
            );
            return;
          }

          let verifiedPaid = false;
          let paymentStatus = 'Pending';

          for (let check = 0; check < 6; check += 1) {
            if (check > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }

            try {
              const result = await checkOneTimePaymentStatus({
                orderId,
                key: checkoutKey
              });

              paymentStatus = result.payment_status || 'Pending';

              if (result.verified_paid === true) {
                verifiedPaid = true;
                break;
              }

              if (['Failed', 'Refunded'].includes(paymentStatus)) {
                break;
              }
            } catch (error) {
              console.warn('Payment status unavailable:', error);
              break;
            }
          }

          if (verifiedPaid) {
            if (typeof clearCart === 'function') {
              clearCart();
            }

            attemptRef.current = null;
            clearPendingCheckout();
            completedSubscriptionsRef.current.clear();
            setCheckoutOpen(false);

            showToast(
              'Payment verified successfully. Your order is confirmed!',
              'success'
            );
          } else {
            showToast(
              paymentStatus === 'Failed'
                ? 'Payment failed. Please check your order before retrying.'
                : 'Payment verification is pending. Do not place another order until its status is confirmed.',
              paymentStatus === 'Failed' ? 'error' : 'success'
            );
          }

          return;
        }


      }



      if (typeof clearCart === 'function') {

        clearCart();

      }



      attemptRef.current = null;

      clearPendingCheckout();

      completedSubscriptionsRef.current.clear();

      setCheckoutOpen(false);



      if (createdSubscriptions.length > 0 && createdOrder) {

        showToast(

          `${createdSubscriptions.length} subscription request${createdSubscriptions.length > 1 ? 's' : ''} submitted. ${createdOrder.order_number || createdOrder.id || 'One-time order'} confirmed. Subscription deliveries require completion of the applicable payment and admin approval steps.`,

          'success'

        );

      } else if (createdSubscriptions.length > 0) {

        showToast(

          subscriptionBillingType === 'prepaid'

            ? 'Subscription request created. Online payment and admin approval are required before deliveries begin.'

            : 'Subscription request submitted. Admin approval is required before deliveries begin.',

          'success'

        );

      } else if (createdOrder) {

        showToast(

          `${createdOrder.order_number || createdOrder.id || 'Order'} confirmed successfully! Your order will be prepared for morning delivery.`,

          'success'

        );

      }

    } catch (error) {

      console.error('Checkout error:', error);



      const message =

        error?.message ||

        'Unable to complete checkout. Please try again.';



      setSubmitError(message);

      showToast(message, 'error');

    } finally {

      setSubmitting(false);

    }

  };



  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">

      <div className="bg-[#FDFBF7] rounded-2xl max-w-xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#D4AF37]/40 relative my-auto">



        {/* Header */}

        <div className="bg-[#0F3E2E] text-white p-4 sm:p-5 relative border-b border-[#D4AF37]/30 shrink-0">



          <button

            onClick={() => setCheckoutOpen(false)}

            disabled={submitting}

            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-emerald-200 hover:text-white p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"

          >

            <X className="w-5 h-5" />

          </button>



          <div className="flex items-center space-x-2 text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-1">

            <Sparkles className="w-4 h-4" />

            <span>5 AM Morning Fresh Dispatch</span>

          </div>



          <h3 className="font-serif-display text-xl sm:text-2xl font-bold text-white pr-8">

            {user

              ? 'Checkout & Order Confirmation'

              : 'Guest Checkout (No Login Required)'}

          </h3>



          <p className="text-[11px] sm:text-xs text-emerald-100/80 mt-1">

            {user

              ? 'Review delivery details and choose your preferred payment mode'

              : 'Order pure A2 dairy products for one-time delivery without creating an account'}

          </p>

        </div>



        <form onSubmit={handleSubmit} className="p-3 sm:p-5 space-y-4 overflow-y-auto">



          {/* Guest Checkout Banner */}

          {!user && (

            <div className="bg-amber-50 px-3 py-2 rounded-xl border border-[#D4AF37]/30 flex items-center gap-2 text-[11px]">

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



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



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

                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"

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





              {/* Subscription Start Date */}

              {hasSubscriptionItem && (

                <div className="space-y-1 sm:col-span-2">

                  <label

                    htmlFor="subscription-start-date"

                    className="text-xs font-medium text-stone-600"

                  >

                    Subscription Start Date *

                  </label>



                  <input

                    id="subscription-start-date"

                    type="date"

                    required

                    value={subscriptionStartDate}

                    min={new Intl.DateTimeFormat('en-CA', {

                      timeZone: 'Asia/Kolkata',

                      year: 'numeric',

                      month: '2-digit',

                      day: '2-digit'

                    }).format(new Date())}

                    onChange={(e) =>

                      setSubscriptionStartDate(e.target.value)

                    }

                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E] focus:outline-none focus:border-[#0F3E2E]"

                  />



                  <p className="text-[11px] text-stone-500">

                    Select today or a future date to begin your milk subscription.

                  </p>

                </div>

              )}



              {/* Subscription Billing Plan */}

              {hasLegacySubscription && (

                <div className="space-y-4 sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">



                  <h4 className="text-sm font-bold text-[#0F3E2E]">

                    Choose Your Subscription Plan

                  </h4>



                  {/* Billing Type */}

                  <div className="space-y-2">

                    <label className="text-xs font-semibold text-stone-700">

                      Billing Type *

                    </label>



                    <div className="grid grid-cols-2 gap-3">

                      {[

                        { value: 'prepaid', label: 'Prepaid' },

                        { value: 'postpaid', label: 'Postpaid' }

                      ].map((option) => (

                        <label

                          key={option.value}

                          className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer ${subscriptionBillingType === option.value

                            ? 'border-[#0F3E2E] bg-white'

                            : 'border-stone-200 bg-stone-50'

                            }`}

                        >

                          <input

                            type="radio"

                            name="subscriptionBillingType"

                            value={option.value}

                            checked={subscriptionBillingType === option.value}

                            onChange={() => setSubscriptionBillingType(option.value)}

                            className="accent-[#0F3E2E]"

                          />

                          <span className="text-xs font-semibold text-[#0F3E2E]">

                            {option.label}

                          </span>

                        </label>

                      ))}

                    </div>

                  </div>



                  {/* Plan Duration */}

                  <div className="space-y-2">

                    <label className="text-xs font-semibold text-stone-700">

                      Subscription Duration *

                    </label>



                    <div className="grid grid-cols-4 gap-2">

                      {[7, 10, 15, 30].map((days) => (

                        <label

                          key={days}

                          className={`flex flex-col items-center justify-center rounded-xl border p-2 cursor-pointer ${subscriptionPlanDays === days

                            ? 'border-[#0F3E2E] bg-white'

                            : 'border-stone-200 bg-stone-50'

                            }`}

                        >

                          <input

                            type="radio"

                            name="subscriptionPlanDays"

                            value={days}

                            checked={subscriptionPlanDays === days}

                            onChange={() => setSubscriptionPlanDays(days)}

                            className="accent-[#0F3E2E]"

                          />

                          <span className="text-xs font-semibold text-[#0F3E2E]">

                            {days} Days

                          </span>

                        </label>

                      ))}

                    </div>

                  </div>



                  <p className="text-[11px] text-stone-600">

                    {subscriptionBillingType === 'prepaid'

                      ? 'Prepaid subscriptions require successful online payment and admin approval before deliveries begin.'

                      : 'Postpaid subscriptions are billed for successfully delivered quantities only.'}

                  </p>



                </div>

              )}



              {hasRecurringSubscription && (

                <div className="space-y-3 sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">

                  <h4 className="text-sm font-bold text-[#0F3E2E]">

                    Recurring Product Delivery Schedule

                  </h4>

                  <p className="text-xs text-stone-600">

                    Prepaid only. Each scheduled delivery is billed separately.

                    Unpaid deliveries are skipped without shifting the schedule.

                  </p>

                  {subscriptionCartItems.map((item, index) =>

                    isRecurringItem(item) && (

                      <label key={index} className="block space-y-2">

                        <span className="text-xs font-semibold text-stone-700">

                          {item.product?.name || 'Recurring product'} — Delivery Interval *

                        </span>

                        <select

                          required

                          value={recurringIntervals[index] || ''}

                          onChange={(event) =>

                            setRecurringIntervals((current) => ({

                              ...current,

                              [index]: event.target.value

                            }))

                          }

                          className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-[#0F3E2E]"

                        >

                          <option value="">Select interval</option>

                          <option value="every_7_days">Every 7 days</option>

                          <option value="every_15_days">Every 15 days</option>

                          <option value="every_30_days">Every 30 days</option>

                        </select>

                      </label>

                    )

                  )}

                </div>

              )}



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

          <div className="space-y-2 pt-3 border-t border-stone-200">



            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F3E2E] flex items-center space-x-2">

              <Wallet className="w-4 h-4 text-[#D4AF37]" />

              <span>2. Select Payment Mode</span>

            </h4>



            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">



              {/* Wallet */}

              <label

                className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${!user

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