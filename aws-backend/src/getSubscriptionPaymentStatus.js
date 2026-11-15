'use strict';

const { createClient } = require('@supabase/supabase-js');

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const respond = (statusCode, body, headers) => ({
  statusCode,
  headers,
  body: JSON.stringify(body)
});

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
      .select('id,billing_type,status,approval_status')
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
