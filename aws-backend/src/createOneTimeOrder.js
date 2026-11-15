const { createClient } = require('@supabase/supabase-js');
const { validateCheckout } = require('./validateCheckout');
const { handleRazorpayWebhook } = require('./razorpayWebhook');
const { handleCreateSubscriptionPaymentOrder } = require('./createSubscriptionPaymentOrder');
const { handleGetSubscriptionPaymentStatus } = require('./getSubscriptionPaymentStatus');
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'https://srivarimilkfarms.com';
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
const respond = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
exports.handler = async event => {
  const path = event.rawPath || event.path;

  if (path === '/payments/webhook') {
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
  if (event.isBase64Encoded || typeof event.body !== 'string' || Buffer.byteLength(event.body, 'utf8') > 16384) return respond(400, { error: 'Invalid request body' });
  let payload;
  try { payload = JSON.parse(event.body); } catch { return respond(400, { error: 'Invalid JSON' }); }
  if (!validateCheckout(payload)) return respond(400, { error: 'Invalid checkout details' });
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
    const { data, error } = await backend.rpc('create_one_time_order_backend', {
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
    return respond(200, { success: true, order: { id: orderId, order_number: orderNumberRow.order_number } });
  } catch (error) { console.error('Checkout service error:', error.message); return respond(500, { error: 'Checkout service temporarily unavailable' }); }
};
