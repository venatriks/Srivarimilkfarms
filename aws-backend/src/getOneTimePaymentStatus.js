'use strict';

const { createClient } = require('@supabase/supabase-js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const respond = (statusCode, body, headers) => ({
  statusCode,
  headers: {
    ...headers,
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});

async function handleGetOneTimePaymentStatus(event, headers) {
  if (
    event.isBase64Encoded ||
    typeof event.body !== 'string' ||
    Buffer.byteLength(event.body, 'utf8') > 2048
  ) {
    return respond(400, { error: 'Invalid request' }, headers);
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return respond(400, { error: 'Invalid JSON' }, headers);
  }

  const orderId = payload?.order_id;
  const checkoutKey = payload?.checkout_key;

  if (
    typeof orderId !== 'string' ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(orderId) ||
    typeof checkoutKey !== 'string' ||
    !UUID.test(checkoutKey)
  ) {
    return respond(400, { error: 'Invalid order reference' }, headers);
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return respond(503, { error: 'Payment status unavailable' }, headers);
  }

  const backend = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data: order, error } = await backend
    .from('one_time_orders')
    .select('payment_status')
    .eq('id', orderId)
    .eq('idempotency_key', checkoutKey)
    .eq('payment_method', 'Razorpay')
    .maybeSingle();

  if (error) {
    console.error('One-time status lookup failed:', error.code);
    return respond(503, { error: 'Payment status unavailable' }, headers);
  }

  if (!order) {
    return respond(404, { error: 'Order not found' }, headers);
  }

  const status = order.payment_status;

  return respond(200, {
    success: true,
    payment_status: status,
    verified_paid: status === 'Paid'
  }, headers);
}

module.exports = { handleGetOneTimePaymentStatus };
