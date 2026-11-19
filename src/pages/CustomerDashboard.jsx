import WhatsAppVerification from '../components/WhatsAppVerification';
import { HistoricalInvoices } from '../components/HistoricalInvoices';
import React, { useMemo, useState } from 'react';
import { InvoiceHistory, PaymentReceiptHistory } from '../components/InvoicePanel';
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
import { getRecurringPaymentStatus } from '../lib/recurringPaymentStatus';
import { createSubscriptionPaymentOrder } from '../lib/subscriptionPayment';
import { openSubscriptionRazorpay } from '../lib/razorpayCheckout';

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

const RECURRING_INTERVALS = {
  every_7_days: 7,
  every_15_days: 15,
  every_30_days: 30
};

const getNextRecurringDate = (startDate, frequency) => {
  const interval = RECURRING_INTERVALS[frequency];

  if (!interval || !/^\d{4}-\d{2}-\d{2}$/.test(startDate || '')) {
    return null;
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) ||
      start.toISOString().slice(0, 10) !== startDate) {
    return null;
  }

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  const todayDate = new Date(`${today}T00:00:00Z`);
  const daysElapsed = Math.floor(
    (todayDate.getTime() - start.getTime()) / 86400000
  );

  const intervalsElapsed = Math.max(
    0,
    Math.ceil(daysElapsed / interval)
  );

  const next = new Date(start);
  next.setUTCDate(start.getUTCDate() + intervalsElapsed * interval);

  return next.toISOString().slice(0, 10);
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
    cancelSubscription,
    deleteSubscription,
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
  const [payingSubscriptionId, setPayingSubscriptionId] = useState(null);

  const [recurringPaymentStatuses, setRecurringPaymentStatuses] =
    useState({});
  const [loadingRecurringStatusId, setLoadingRecurringStatusId] =
    useState(null);

  const handleLoadRecurringPaymentStatus = async (subscription) => {
    if (!user?.id || loadingRecurringStatusId) return;

    setLoadingRecurringStatusId(subscription.id);

    try {
      const result = await getRecurringPaymentStatus(subscription.id);

      setRecurringPaymentStatuses(previous => ({
        ...previous,
        [subscription.id]: {
          data: result,
          error: null
        }
      }));
    } catch (error) {
      setRecurringPaymentStatuses(previous => ({
        ...previous,
        [subscription.id]: {
          data: null,
          error: error.message || 'Unable to load payment status.'
        }
      }));
    } finally {
      setLoadingRecurringStatusId(null);
    }
  };


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


  const handlePaySubscription = async (subscription, deliveryDate) => {
    if (!user?.id || payingSubscriptionId !== null) return;

    if (
      String(subscription.userId) !== String(user.id) ||
      subscription.status === 'Cancelled' ||
      !deliveryDate
    ) {
      showToast('This subscription is not eligible for payment.', 'error');
      return;
    }

    setPayingSubscriptionId(subscription.id);

    try {
      // Backend validates ownership, invoice, amount and payment deadline.
      const order = await createSubscriptionPaymentOrder(
        subscription.id,
        deliveryDate
      );

      const result = await openSubscriptionRazorpay({
        order,
        customer: {
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      });

      if (result?.submitted) {
        // Refresh server-side payment status after Razorpay submission.
        // The browser callback itself is not proof of settlement.
        try {
          const paymentStatus = await getRecurringPaymentStatus(subscription.id);
          setRecurringPaymentStatuses(previous => ({
            ...previous,
            [subscription.id]: { data: paymentStatus, error: null }
          }));
        } catch (statusError) {
          console.warn('Payment status refresh unavailable:', statusError);
        }
        showToast(
          'Payment submitted. Check Payment Status for verified confirmation. ' +
          'Delivery remains subject to payment eligibility and approval.',
          'success'
        );
      } else {
        showToast(
          'Payment was not completed. You can retry while the payment window remains open.',
          'info'
        );
      }
    } catch (error) {
      console.error('Subscription payment error:', error);
      showToast(
        error?.message || 'Unable to initiate subscription payment.',
        'error'
      );
    } finally {
      setPayingSubscriptionId(null);
    }
  };

  const handlePauseResume = async (subscription) => {
    if (!user?.id || savingSubscriptionId) return;

    if (!['Active', 'Paused'].includes(subscription.status)) {
      showToast('This subscription cannot be paused or resumed.', 'error');
      return;
    }

    setSavingSubscriptionId(subscription.id);

    try {
      await toggleSubscriptionPause(subscription.id);
    } catch (error) {
      console.error('Subscription status update exception:', error);
      showToast('Unable to update your subscription right now.', 'error');
    } finally {
      setSavingSubscriptionId(null);
    }
  };

  const handleCancelSubscription = async (subscription) => {
    if (!user?.id || savingSubscriptionId !== null) return;

    if (
      String(subscription.userId) !== String(user.id) ||
      !['Active', 'Paused'].includes(subscription.status)
    ) {
      showToast('This subscription cannot be cancelled.', 'error');
      return;
    }

    const confirmed = window.confirm(
      'Cancel this milk subscription? This will stop future deliveries. ' +
      'Your subscription record will be retained.'
    );

    if (!confirmed) return;

    setSavingSubscriptionId(subscription.id);

    try {
      await cancelSubscription(subscription.id);
    } catch (error) {
      console.error('Subscription cancellation exception:', error);
      showToast('Unable to cancel your subscription right now.', 'error');
    } finally {
      setSavingSubscriptionId(null);
    }
  };

  const handleDeleteSubscription = async (subscription) => {
    if (!user?.id || savingSubscriptionId !== null) return;

    if (
      String(subscription.userId) !== String(user.id) ||
      subscription.status !== 'Cancelled'
    ) {
      showToast('Only your cancelled subscriptions can be deleted.', 'error');
      return;
    }

    const confirmed = window.confirm(
      'PERMANENTLY DELETE this cancelled subscription? ' +
      'This action cannot be undone. The subscription record will be removed.'
    );

    if (!confirmed) return;

    setSavingSubscriptionId(subscription.id);

    try {
      await deleteSubscription(subscription.id);
    } catch (error) {
      console.error('Subscription deletion exception:', error);
      showToast('Unable to delete your subscription right now.', 'error');
    } finally {
      setSavingSubscriptionId(null);
    }
  };

  const handleQuantityChange = async (subscription, newQuantity) => {
    if (!user?.id || savingSubscriptionId) return;

    if (String(subscription.billingType || subscription.billing_type || '')
        .toLowerCase() !== 'postpaid') {
      showToast(
        'Prepaid subscription quantities cannot be changed during the current cycle.',
        'error'
      );
      return;
    }

    if (!['Active', 'Paused'].includes(subscription.status)) {
      showToast('This subscription quantity cannot be changed.', 'error');
      return;
    }

    const quantity = Math.max(1, Number(newQuantity) || 1);

    if (quantity === Number(subscription.quantity)) return;

    setSavingSubscriptionId(subscription.id);

    try {
      await updateSubscriptionQty(subscription.id, quantity);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <WhatsAppVerification />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-10">
          {/* Subscription heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#0F3E2E] flex items-center space-x-2">
              <Milk className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
              <span>Your Daily Milk Subscriptions</span>
            </h2>

            <span className="text-xs text-stone-500 font-medium">
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
              const isPaused = subscription.status === 'Paused';
              const isCancelled = subscription.status === 'Cancelled';
              const canModifySubscription = isActive || isPaused;
              const canChangeQuantity =
                canModifySubscription &&
                String(
                  subscription.billingType ||
                  subscription.billing_type || ''
                ).toLowerCase() === 'postpaid';
              const bottlesExchanged = Number(
                subscription.bottlesExchanged || 0
              );
              const pricePerDay = Number(
                subscription.pricePerDay || 0
              );
              const recurringDays = RECURRING_INTERVALS[subscription.frequency];
              const isRecurring = Boolean(recurringDays);
              const nextRecurringDate = isRecurring
                ? getNextRecurringDate(
                    subscription.startDate,
                    subscription.frequency
                  )
                : null;

              return (
                <div
                  key={subscription.id}
                  className={`bg-white rounded-3xl p-4 sm:p-6 border shadow-md transition-all space-y-4 sm:space-y-6 ${isActive
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
                          : isPaused
                            ? 'bg-amber-200 text-amber-900'
                            : isCancelled
                              ? 'bg-red-100 text-red-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                      >
                        {isActive
                          ? 'Active Dispatch'
                          : isPaused
                            ? 'Vacation Paused'
                            : isCancelled
                              ? 'Cancelled'
                              : subscription.status || 'Unknown Status'}
                      </span>

                      <h3 className="font-serif-display text-xl font-bold text-[#0F3E2E] mt-1">
                        {productName}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          !canModifySubscription ||
                          savingSubscriptionId !== null
                        }
                        onClick={() => handlePauseResume(subscription)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 ${isActive
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : 'bg-[#0F3E2E] text-white hover:bg-[#18523f]'
                          }`}
                      >
                        {isCancelled ? (
                          <span>Subscription Cancelled</span>
                        )
                          : isActive ? (
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

                      {isCancelled && (
                        <button
                          type="button"
                          disabled={savingSubscriptionId !== null}
                          onClick={() => handleDeleteSubscription(subscription)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {savingSubscriptionId === subscription.id
                            ? 'Deleting...'
                            : 'Delete Subscription'}
                        </button>
                      )}

                      {canModifySubscription && (
                        <button
                          type="button"
                          disabled={savingSubscriptionId !== null}
                          onClick={() => handleCancelSubscription(subscription)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50"
                        >
                          {savingSubscriptionId === subscription.id
                            ? 'Saving...'
                            : 'Cancel Subscription'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isRecurring && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 text-xs">
                      <p className="font-bold text-[#0F3E2E]">
                        Recurring Delivery — Every {recurringDays} Days
                      </p>
                      <p className="text-stone-700">
                        Original Start Date: {subscription.startDate || 'Unavailable'}
                      </p>
                      <p className="text-stone-700">
                        {isCancelled
                          ? 'Future deliveries cancelled'
                          : nextRecurringDate
                            ? `Next Scheduled Date: ${nextRecurringDate}`
                            : 'Next scheduled date unavailable'}
                      </p>
                      <p className="text-stone-700">
                        Admin Approval: {subscription.approvalStatus || 'Pending'}
                      </p>
                      <p className="text-amber-800">
                        Each delivery requires separate prepaid payment before
                        11:59 PM IST on the previous calendar day.
                        Delivery is subject to verified payment and approval.
                      </p>
                      <p className="text-stone-600">
                        Use Pay Now to initiate payment for the next
                        scheduled recurring delivery. Payment verification
                        and delivery approval remain mandatory.
                      </p>

                      <button
                        type="button"
                        disabled={
                          payingSubscriptionId !== null ||
                          !nextRecurringDate ||
                          isCancelled
                        }
                        onClick={() =>
                          handlePaySubscription(
                            subscription,
                            nextRecurringDate
                          )
                        }
                        className="mt-3 px-4 py-2 rounded-xl bg-[#0F3E2E] text-white text-sm font-bold disabled:opacity-50"
                      >
                        {payingSubscriptionId === subscription.id
                          ? 'Opening Payment...'
                          : 'Pay Now'}
                      </button>

                    </div>
                  )}


                  {isRecurring && (
                    <div className="rounded-2xl border border-stone-200 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h4 className="font-bold text-sm text-[#0F3E2E]">
                          Delivery Payment Status
                        </h4>

                        <button
                          type="button"
                          onClick={() =>
                            handleLoadRecurringPaymentStatus(subscription)
                          }
                          disabled={loadingRecurringStatusId !== null}
                          className="px-3 py-2 rounded-lg bg-[#0F3E2E] text-white text-xs font-bold disabled:opacity-50"
                        >
                          {loadingRecurringStatusId === subscription.id
                            ? 'Checking...'
                            : 'Check Payment Status'}
                        </button>
                      </div>

                      {recurringPaymentStatuses[subscription.id]?.error && (
                        <p className="text-xs text-red-700">
                          {recurringPaymentStatuses[subscription.id].error}
                        </p>
                      )}

                      {recurringPaymentStatuses[subscription.id]?.data && (() => {
                        const result =
                          recurringPaymentStatuses[subscription.id].data;

                        const delivery = result.next_delivery;
                        const missed = result.missed_delivery;

                        const formatDeadline = (value) =>
                          value
                            ? new Date(value).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              }) + ' IST'
                            : 'Unavailable';

                        const paymentLabel = (attempt) => {
                          const decision =
                            attempt?.delivery_payment_decision;

                          if (decision === 'eligible') {
                            return 'Payment evidence eligible';
                          }

                          if (decision === 'late') {
                            return 'Payment received after deadline';
                          }

                          if (decision === 'needs_review') {
                            return 'Payment under review — delivery not authorized';
                          }

                          return 'Not verified';
                        };

                        if (!delivery && !missed) {
                          return (
                            <p className="text-xs text-stone-600">
                              Delivery payment information is unavailable.
                            </p>
                          );
                        }

                        return (
                          <div className="space-y-4 text-xs text-stone-700">
                            {missed && (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                                <p className="font-bold text-amber-900">
                                  Today's Scheduled Delivery
                                </p>

                                <p>
                                  <strong>Date:</strong> {missed.date}
                                </p>

                                <p>
                                  <strong>Payment Deadline:</strong>{' '}
                                  {formatDeadline(missed.payment_due_at)}
                                </p>

                                <p>
                                  <strong>Payment Status:</strong>{' '}
                                  {missed.payment_state === 'payment_eligible'
                                    ? 'Payment eligible — delivery subject to approval and entitlement'
                                    : missed.payment_state === 'under_review'
                                      ? 'Payment under review — delivery not authorized'
                                      : missed.payment_state === 'late'
                                        ? 'Payment received after deadline — delivery not authorized'
                                        : 'Payment missed — delivery not authorized'}
                                </p>

                                <p>
                                  <strong>Invoice:</strong>{' '}
                                  {missed.invoice?.status || 'Not generated'}
                                </p>

                                <p>
                                  <strong>Payment Attempt:</strong>{' '}
                                  {missed.payment_attempt?.status ||
                                    'No payment attempt'}
                                </p>
                              </div>
                            )}

                            {delivery && (
                              <div className="rounded-xl border border-stone-200 p-3 space-y-2">
                                <p className="font-bold text-[#0F3E2E]">
                                  Next Payable Scheduled Delivery
                                </p>

                                <p>
                                  <strong>Date:</strong> {delivery.date}
                                </p>

                                <p>
                                  <strong>Payment Deadline:</strong>{' '}
                                  {formatDeadline(delivery.payment_due_at)}
                                </p>

                                <p>
                                  <strong>Invoice:</strong>{' '}
                                  {delivery.invoice?.status || 'Not generated'}
                                </p>

                                {delivery.invoice && (
                                  <p>
                                    <strong>Amount:</strong>{' '}
                                    ₹{(
                                      delivery.invoice.amount_due_paise / 100
                                    ).toFixed(2)}
                                  </p>
                                )}

                                <p>
                                  <strong>Payment:</strong>{' '}
                                  {delivery.payment_attempt?.status ||
                                    'No payment attempt'}
                                </p>

                                <p>
                                  <strong>Verification:</strong>{' '}
                                  {paymentLabel(delivery.payment_attempt)}
                                </p>

                                <p className="font-medium text-amber-800">
                                  {delivery.delivery_entitlement_confirmed === true
                                    ? 'Delivery entitlement confirmed'
                                    : 'Delivery entitlement not confirmed'}
                                </p>
                              </div>
                            )}

                            <p className="text-stone-500">
                              Prepaid recurring deliveries require verified payment before the applicable payment deadline.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Quantity / delivery / price */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 space-y-2">
                      <span className="text-stone-500 font-medium">
                        {isRecurring ? 'Quantity per Delivery' : 'Daily Quantity'}
                      </span>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={
                            !canChangeQuantity ||
                            savingSubscriptionId !== null ||
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
                            !canChangeQuantity ||
                            savingSubscriptionId !== null
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
                        {isRecurring ? 'Amount per Delivery' : 'Daily Amount'}
                      </span>

                      <p className="font-bold text-[#0F3E2E] text-sm">
                        ₹{pricePerDay.toFixed(0)}
                        {isRecurring ? ' / delivery' : ' / day'}
                      </p>

                      <p className="text-[10px] text-stone-500">
                        {subscription.billingType === 'prepaid'
                          ? 'Prepaid subscription'
                          : subscription.billingType === 'postpaid'
                            ? 'Postpaid — billed for delivered quantities'
                            : 'Select a subscription plan to continue'}
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

          <PaymentReceiptHistory key={'receipts-' + user.id} />
          <HistoricalInvoices key={'orders-' + user.id} />
          <InvoiceHistory key={user.id} />

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
