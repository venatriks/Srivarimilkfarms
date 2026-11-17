'use strict';

const { createClient } = require('@supabase/supabase-js');

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const respond = (statusCode, body, headers) => ({
  statusCode,
  headers: {
    ...headers,
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});


const RECURRING_INTERVALS = {
  every_7_days: 7,
  every_15_days: 15,
  every_30_days: 30
};

function todayIST() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(part => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function nextScheduledDate(startDate, interval) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '')) {
    return null;
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) ||
      start.toISOString().slice(0, 10) !== startDate) {
    return null;
  }

  const today = new Date(`${todayIST()}T00:00:00Z`);
  const elapsed = Math.floor(
    (today.getTime() - start.getTime()) / 86400000
  );

  const count = Math.max(0, Math.ceil(elapsed / interval));
  start.setUTCDate(start.getUTCDate() + count * interval);

  return start.toISOString().slice(0, 10);
}

function deliveryDeadline(date) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);

  // Previous calendar day, 23:59 IST = 18:29 UTC.
  return `${day.toISOString().slice(0, 10)}T18:29:00.000Z`;
}

async function handleGetSubscriptionPaymentStatus(event, headers) {
  const {
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey
  } = process.env;

  if (!url || !anonKey || !serviceKey) {
    return respond(503, { error: 'Payment status unavailable' }, headers);
  }

  const subscriptionId =
    event.queryStringParameters?.subscription_id;

  if (typeof subscriptionId !== 'string' || !UUID.test(subscriptionId)) {
    return respond(400, {
      error: 'Valid subscription_id is required'
    }, headers);
  }

  const requestHeaders = event.headers || {};
  const authorization =
    requestHeaders.authorization ||
    requestHeaders.Authorization ||
    '';

  const bearer = /^Bearer\s+([^\s]+)$/i.exec(authorization);

  if (!bearer) {
    return respond(401, {
      error: 'Please sign in to view payment status'
    }, headers);
  }

  const authClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data: authData, error: authError } =
    await authClient.auth.getUser(bearer[1]);

  if (authError || !authData?.user?.id) {
    return respond(401, {
      error: 'Session expired. Please sign in again.'
    }, headers);
  }

  const customerId = authData.user.id;

  // Service-role credentials must never be sent to the browser.
  const backend = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data: subscription, error: subscriptionError } =
    await backend
      .from('subscriptions')
      .select('id,billing_type,status,approval_status,frequency,start_date')
      .eq('id', subscriptionId)
      .eq('user_id', customerId)
      .maybeSingle();

  if (subscriptionError) throw subscriptionError;

  if (!subscription) {
    return respond(404, {
      error: 'Subscription not found'
    }, headers);
  }

  if (subscription.billing_type !== 'prepaid') {
    return respond(200, {
      subscription_id: subscription.id,
      billing_type: subscription.billing_type,
      subscription_status: subscription.status,
      approval_status: subscription.approval_status,
      invoice: null,
      payment_attempt: null
    }, headers);
  }


  // Recurring products: return only the next scheduled delivery.
  // This is read-only and never initiates payment.
  if (RECURRING_INTERVALS[subscription.frequency]) {
    const interval = RECURRING_INTERVALS[subscription.frequency];
    const scheduledToday = nextScheduledDate(
      subscription.start_date,
      interval
    );

    const today = todayIST();
    const missedDate = scheduledToday === today
      ? scheduledToday
      : null;

    let deliveryDate = scheduledToday;

    if (missedDate) {
      const next = new Date(`${scheduledToday}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + interval);
      deliveryDate = next.toISOString().slice(0, 10);
    }

    if (!deliveryDate) {
      return respond(200, {
        subscription_id: subscription.id,
        billing_type: subscription.billing_type,
        subscription_status: subscription.status,
        approval_status: subscription.approval_status,
        recurring: true,
        error: 'Unable to calculate delivery schedule',
        next_delivery: null
      }, headers);
    }

    let missedDelivery = null;

    if (missedDate) {
      const { data: missedInvoice, error: missedInvoiceError } =
        await backend
          .from('subscription_invoices')
          .select('id,status,amount_due_paise,payment_due_at')
          .eq('subscription_id', subscription.id)
          .eq('customer_id', customerId)
          .eq('invoice_kind', 'delivery')
          .eq('period_start', missedDate)
          .maybeSingle();

      if (missedInvoiceError) throw missedInvoiceError;

      let missedAttempt = null;

      if (missedInvoice) {
        const { data, error } = await backend
          .from('payment_attempts')
          .select('status,delivery_payment_decision')
          .eq('customer_id', customerId)
          .eq('target_type', 'subscription_invoice')
          .eq('target_id', String(missedInvoice.id))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        missedAttempt = data;
      }

      const decision = missedAttempt?.delivery_payment_decision;
      const paymentCaptured =
        missedAttempt?.status === 'captured' ||
        missedInvoice?.status === 'paid';

      missedDelivery = {
        date: missedDate,
        payment_due_at: missedInvoice?.payment_due_at ||
          deliveryDeadline(missedDate),
        invoice: missedInvoice ? {
          id: missedInvoice.id,
          status: missedInvoice.status,
          amount_due_paise: Number(missedInvoice.amount_due_paise)
        } : null,
        payment_attempt: missedAttempt ? {
          status: missedAttempt.status,
          delivery_payment_decision: decision || null
        } : null,
        payment_state: decision === 'eligible'
          ? 'payment_eligible'
          : decision === 'late'
            ? 'late'
            : decision === 'needs_review' || paymentCaptured
              ? 'under_review'
              : 'missed'
      };
    }

    const { data: invoice, error: invoiceError } = await backend
      .from('subscription_invoices')
      .select(
        'id,status,amount_due_paise,period_start,period_end,payment_due_at'
      )
      .eq('subscription_id', subscription.id)
      .eq('customer_id', customerId)
      .eq('invoice_kind', 'delivery')
      .eq('period_start', deliveryDate)
      .maybeSingle();

    if (invoiceError) throw invoiceError;

    let attempt = null;

    if (invoice) {
      const { data, error } = await backend
        .from('payment_attempts')
        .select('status,delivery_payment_decision,provider_capture_verified_at')
        .eq('customer_id', customerId)
        .eq('target_type', 'subscription_invoice')
        .eq('target_id', String(invoice.id))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      attempt = data;
    }

    let entitlementConfirmed = false;

    if (
      invoice?.status === 'paid' &&
      attempt?.status === 'captured' &&
      attempt.delivery_payment_decision === 'eligible' &&
      attempt.provider_capture_verified_at &&
      invoice.payment_due_at &&
      Date.parse(attempt.provider_capture_verified_at) <
        Date.parse(invoice.payment_due_at)
    ) {
      const { data: entitlement, error: entitlementError } =
        await backend
          .from('subscription_entitlements')
          .select('invoice_id')
          .eq('invoice_id', invoice.id)
          .eq('subscription_id', subscription.id)
          .eq('calendar_period_start', deliveryDate)
          .eq('calendar_period_end', deliveryDate)
          .maybeSingle();

      if (entitlementError) throw entitlementError;

      entitlementConfirmed = Boolean(entitlement);
    }

    const deadline = invoice?.payment_due_at ||
      deliveryDeadline(deliveryDate);

    const paymentWindowOpen =
      Date.now() < new Date(deadline).getTime();

    return respond(200, {
      subscription_id: subscription.id,
      billing_type: subscription.billing_type,
      subscription_status: subscription.status,
      approval_status: subscription.approval_status,
      recurring: true,
      frequency: subscription.frequency,
      missed_delivery: missedDelivery,
      next_delivery: {
        date: deliveryDate,
        payment_due_at: deadline,
        payment_window_open: paymentWindowOpen,
        invoice: invoice ? {
          id: invoice.id,
          status: invoice.status,
          amount_due_paise: Number(invoice.amount_due_paise)
        } : null,
        payment_attempt: attempt ? {
          status: attempt.status,
          delivery_payment_decision:
            attempt.delivery_payment_decision || null
        } : null,
        delivery_entitlement_confirmed: entitlementConfirmed
      }
    }, headers);
  }

  const { data: invoice, error: invoiceError } = await backend
    .from('subscription_invoices')
    .select(
      'id,status,amount_due_paise,period_start,period_end,created_at'
    )
    .eq('subscription_id', subscription.id)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (invoiceError) throw invoiceError;

  let paymentAttempt = null;

  if (invoice) {
    const { data, error } = await backend
      .from('payment_attempts')
      .select('status,created_at')
      .eq('customer_id', customerId)
      .eq('target_type', 'subscription_invoice')
      .eq('target_id', String(invoice.id))
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    paymentAttempt = data;
  }

  return respond(200, {
    subscription_id: subscription.id,
    billing_type: subscription.billing_type,
    subscription_status: subscription.status,
    approval_status: subscription.approval_status,
    invoice: invoice
      ? {
          id: invoice.id,
          status: invoice.status,
          amount_due_paise: Number(invoice.amount_due_paise),
          period_start: invoice.period_start,
          period_end: invoice.period_end
        }
      : null,
    payment_attempt: paymentAttempt
      ? { status: paymentAttempt.status }
      : null
  }, headers);
}

module.exports = { handleGetSubscriptionPaymentStatus };
