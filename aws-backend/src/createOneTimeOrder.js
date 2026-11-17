const { createClient } = require('@supabase/supabase-js');
const { validateCheckout } = require('./validateCheckout');
const { getPaymentConfig } = require('./paymentConfig');
const { handleRazorpayWebhook } = require('./razorpayWebhook');
const {
  reconcileOverdueOrders
} = require('./reconcileOverdueOrders');

const { handleCreateSubscriptionPaymentOrder } = require('./createSubscriptionPaymentOrder');
const { handleGetSubscriptionPaymentStatus } = require('./getSubscriptionPaymentStatus');
const { handleGetOneTimePaymentStatus } = require('./getOneTimePaymentStatus');
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'https://srivarimilkfarms.com';
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
const respond = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

exports.handler = async event => {
  // Internal AWS invocation only.
  // This is not an HTTP route.
  if (
    event?.source === 'srivari.internal.reconciliation' &&
    event?.detail?.action === 'reconcile-overdue-orders' &&
    !event?.requestContext
  ) {
    if (
      process.env.ENABLE_INTERNAL_RECONCILIATION !== 'true'
    ) {
      return {
        statusCode: 503,
        body: JSON.stringify({
          error: 'Internal reconciliation disabled'
        })
      };
    }

    // Cleanup requires an additional explicit request.
    // Reconciliation alone never releases stock.
    const releaseUnattached =
      event?.detail?.releaseUnattached === true;

    if (
      releaseUnattached &&
      process.env.ENABLE_MANUAL_STOCK_CLEANUP !== 'true'
    ) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Manual stock cleanup disabled'
        })
      };
    }

    return await reconcileOverdueOrders({
      releaseUnattached
    });
  }

  const path = event.rawPath || event.path;

  if (path === '/payments/webhook') {
    const webhookMethod =
      event.requestContext?.http?.method || event.httpMethod;

    if (webhookMethod !== 'POST') {
      return respond(405, { error: 'Method not allowed' });
    }

    return handleRazorpayWebhook(event);
  }
  const requestHeaders = event.headers || {};
  const origin = requestHeaders.origin || requestHeaders.Origin;
  if (origin && origin !== allowedOrigin) return respond(403, { error: 'Origin not allowed' });
  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (path === '/payments/subscription/status') {
    if (method !== 'GET') {
      return respond(405, { error: 'Method not allowed' });
    }
    try {
      return await handleGetSubscriptionPaymentStatus(event, headers);
    } catch (error) {
      console.error('Subscription status service error:', error.message);
      return respond(503, {
        error: 'Subscription payment status unavailable'
      });
    }
  }
  if (path === '/payments/one-time/status') {
    if (method !== 'POST') {
      return respond(405, { error: 'Method not allowed' });
    }
    try {
      return await handleGetOneTimePaymentStatus(event, headers);
    } catch (error) {
      console.error('One-time payment status error:', error.message);
      return respond(503, {
        error: 'Payment status unavailable'
      });
    }
  }
  if (method !== 'POST') return respond(405, { error: 'Method not allowed' });
  if (path === '/payments/subscription/create-order') {
    try {
      return await handleCreateSubscriptionPaymentOrder(event, headers);
    } catch (error) {
      console.error('Subscription payment service error:', error.message);
      return respond(503, {
        error: 'Subscription payment service unavailable'
      });
    }
  }
  if (path !== '/checkout') {
    return respond(404, { error: 'Route not found' });
  }

  if (event.isBase64Encoded || typeof event.body !== 'string' || Buffer.byteLength(event.body, 'utf8') > 16384) return respond(400, { error: 'Invalid request body' });
  let payload;
  try { payload = JSON.parse(event.body); } catch { return respond(400, { error: 'Invalid JSON' }); }
  if (!validateCheckout(payload)) return respond(400, { error: 'Invalid checkout details' });
  const paymentConfig = payload.p_payment_method === 'Razorpay'
    ? getPaymentConfig()
    : null;

  if (paymentConfig && !paymentConfig.enabled) {
    return respond(503, {
      error: 'Online payment is unavailable'
    });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return respond(500, { error: 'Checkout service unavailable' });
  const authHeader = requestHeaders.authorization || requestHeaders.Authorization;
  let accessToken = null;
  if (authHeader != null) {
    const match = /^Bearer\s+([^\s]+)$/i.exec(authHeader);
    if (!match) return respond(401, { error: 'Invalid authorization header' });
    accessToken = match[1];
  }
  try {
    let verifiedCustomerId = null;
    if (accessToken) {
      const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await authClient.auth.getUser(accessToken);
      if (error || !data?.user?.id) return respond(401, { error: 'Session expired. Please sign in again.' });
      verifiedCustomerId = data.user.id;
    }
    // Never attach the caller's bearer token to this privileged client.
    const backend = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await backend.rpc(
      payload.p_payment_method === 'Razorpay'
        ? 'create_one_time_order_razorpay_pending'
        : 'create_one_time_order_backend',
      {
      p_customer_name: payload.p_customer_name, p_customer_email: payload.p_customer_email,
      p_customer_phone: payload.p_customer_phone, p_address: payload.p_address,
      p_items: payload.p_items, p_delivery_slot: payload.p_delivery_slot,
      p_instructions: payload.p_instructions || null, p_payment_method: payload.p_payment_method,
      p_idempotency_key: payload.p_idempotency_key, p_verified_customer_id: verifiedCustomerId
    });
    if (error) { console.error('Checkout RPC failed:', error.code); return respond(400, { error: 'Unable to create order. Please verify your details.' }); }
    // The RPC may return an existing order for an idempotent retry. Always
    // read the persisted display number using the privileged backend client.
    const rpcResult = Array.isArray(data) ? data[0] : data;
    const orderId = typeof rpcResult === 'string' ? rpcResult : rpcResult?.id;
    if (typeof orderId !== 'string' || !orderId.trim()) {
      console.error('Checkout RPC returned no order id');
      return respond(500, { error: 'Unable to verify order confirmation. Please check your orders before retrying.' });
    }
    const { data: orderNumberRow, error: lookupError } = await backend
      .from('one_time_orders').select('order_number').eq('id', orderId).single();
    if (lookupError || !orderNumberRow?.order_number) {
      console.error('Order number lookup failed:', lookupError?.code);
      return respond(500, { error: 'Unable to verify order confirmation. Please check your orders before retrying.' });
    }

    if (payload.p_payment_method === 'Razorpay') {
      const { keyId, keySecret } = paymentConfig;

      if (!keyId || !keySecret) {
        return respond(503, {
          error: 'Online payment is not configured'
        });
      }

      const { data: claimRows, error: claimError } =
        await backend.rpc('claim_one_time_payment_attempt', {
          p_order_id: orderId,
          p_idempotency_key: payload.p_idempotency_key,
          p_customer_id: verifiedCustomerId
        });

      const claim = Array.isArray(claimRows)
        ? claimRows[0]
        : claimRows;

      if (claimError || !claim) {
        return respond(503, {
          error: 'Unable to initiate payment'
        });
      }

      let providerOrderId = claim.provider_order_id;

      if (!providerOrderId) {
        if (!claim.newly_claimed) {
          return respond(503, {
            error: 'Payment initiation requires reconciliation'
          });
        }

        let response;

        try {
          response = await fetch(
            'https://api.razorpay.com/v1/orders',
            {
              method: 'POST',
              headers: {
                Authorization:
                  'Basic ' +
                  Buffer.from(
                    keyId + ':' + keySecret
                  ).toString('base64'),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                amount: Number(claim.amount_paise),
                currency: 'INR',
                receipt: claim.attempt_id
              }),
              signal: AbortSignal.timeout(10000)
            }
          );
        } catch {
          return respond(503, {
            error: 'Payment initiation uncertain; reconciliation required'
          });
        }

        if (!response.ok) {
          return respond(503, {
            error: 'Razorpay order creation failed'
          });
        }

        const providerOrder =
          await response.json().catch(() => null);

        if (
          !/^order_[A-Za-z0-9]+$/.test(providerOrder?.id || '') ||
          providerOrder.currency !== 'INR' ||
          Number(providerOrder.amount) !==
            Number(claim.amount_paise)
        ) {
          return respond(503, {
            error: 'Invalid Razorpay order response'
          });
        }

        const { error: attachError } =
          await backend.rpc('attach_one_time_provider_order', {
            p_attempt_id: claim.attempt_id,
            p_provider_order_id: providerOrder.id,
            p_amount_paise: Number(claim.amount_paise)
          });

        if (attachError) {
          return respond(503, {
            error: 'Payment order requires reconciliation'
          });
        }

        providerOrderId = providerOrder.id;
      }

      return respond(200, {
        success: true,
        payment_status: 'Pending Payment',
        order: {
          id: orderId,
          order_number: orderNumberRow.order_number
        },
        razorpay: {
          key_id: keyId,
          order_id: providerOrderId,
          amount_paise: Number(claim.amount_paise),
          currency: 'INR'
        }
      });
    }

    return respond(200, {
      success: true,
      order: {
        id: orderId,
        order_number: orderNumberRow.order_number
      }
    });
  } catch (error) { console.error('Checkout service error:', error.message); return respond(500, { error: 'Checkout service temporarily unavailable' }); }
};
