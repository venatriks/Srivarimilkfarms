
const crypto = require('node:crypto');
const { getPaymentConfig } = require('./paymentConfig');
const { createClient } = require('@supabase/supabase-js');
const {
  reconcileOneTimePayment
} = require('./reconcileOneTimePayment');

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

function safeEqualSignature(signature, rawBody, secret) {
  if (typeof signature !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(signature)) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest();

  return crypto.timingSafeEqual(
    expected,
    Buffer.from(signature, 'hex')
  );
}

async function handleRazorpayWebhook(event) {
  const paymentConfig = getPaymentConfig();

  if (!paymentConfig.enabled) {
    return respond(503, { error: 'Payment routes disabled' });
  }

  const {
    webhookSecret: secret,
    keyId,
    keySecret
  } = paymentConfig;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !url || !serviceKey || !keyId || !keySecret) {
    return respond(503, { error: 'Payment service unavailable' });
  }

  if (typeof event.body !== 'string') {
    return respond(400, { error: 'Invalid body' });
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body, 'utf8');

  if (!rawBody.length || rawBody.length > 262144) {
    return respond(400, { error: 'Invalid body size' });
  }

  const headers = Object.fromEntries(
    Object.entries(event.headers || {})
      .map(([key, value]) => [key.toLowerCase(), value])
  );

  if (!safeEqualSignature(
    headers['x-razorpay-signature'],
    rawBody,
    secret
  )) {
    return respond(401, { error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return respond(400, { error: 'Invalid JSON' });
  }

  if (payload.event !== 'payment.captured') {
    return respond(200, { received: true, ignored: true });
  }

  const payment = payload.payload?.payment?.entity;
  const eventId = headers['x-razorpay-event-id'];

  if (!payment ||
    !/^pay_[A-Za-z0-9]+$/.test(payment.id || '') ||
    !/^order_[A-Za-z0-9]+$/.test(payment.order_id || '') ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(eventId || '')) {
    return respond(400, { error: 'Invalid payment event' });
  }

  const backend = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    // Independently retrieve the payment from Razorpay.
    const credentials = Buffer.from(
      `${keyId}:${keySecret}`
    ).toString('base64');

    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${payment.id}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      console.error('Razorpay payment fetch failed:', response.status);
      return respond(503, { error: 'Payment verification unavailable' });
    }

    const verified = await response.json();

    if (verified.amount_refunded !== 0) {
      console.error('Payment refund review required:', {
        paymentId: payment.id
      });

      return respond(503, {
        error: 'Payment requires refund reconciliation'
      });
    }

    if (verified.status !== 'captured' ||
      verified.id !== payment.id ||
      verified.order_id !== payment.order_id ||
      verified.currency !== 'INR' ||
      !Number.isSafeInteger(verified.amount) ||
      verified.amount <= 0) {
      return respond(422, { error: 'Payment verification mismatch' });
    }

    const { data: attempts, error: lookupError } =
      await backend.rpc('get_razorpay_payment_attempt', {
        p_provider_order_id: verified.order_id
      });

    if (lookupError) throw lookupError;

    const attempt = Array.isArray(attempts)
      ? attempts[0]
      : attempts;

    if (!attempt) {
      console.error('Payment attempt not found:', verified.order_id);
      return respond(503, { error: 'Payment reconciliation required' });
    }

    if (attempt.currency !== verified.currency ||
      Number(attempt.amount_paise) !== verified.amount) {
      console.error('Payment amount or currency mismatch');
      return respond(503, { error: 'Payment reconciliation required' });
    }

    // Independently reconcile one-time Razorpay payments.
    // Never infer stock-release eligibility from this result.
    if (attempt.target_type === 'one_time_order') {
      const reconciliation = await reconcileOneTimePayment({
        providerOrderId: verified.order_id,
        expectedAmountPaise: verified.amount
      });

      if (
        reconciliation.status !== 'captured' ||
        reconciliation.paymentId !== verified.id
      ) {
        console.error(
          'One-time payment reconciliation requires review:',
          reconciliation.status
        );

        return respond(503, {
          error: 'Payment reconciliation required'
        });
      }
    }

    // Signed webhook event creation time is retained for audit.
    // It is NOT treated as the actual payment capture timestamp.
    const providerEventAt =
      Number.isSafeInteger(payload.created_at) &&
      payload.created_at > 0
        ? new Date(payload.created_at * 1000).toISOString()
        : null;

    async function recordRecurringEventEvidence() {
      if (attempt.target_type !== 'subscription_invoice') return;

      const { error } = await backend.rpc(
        'record_recurring_payment_event',
        {
          p_attempt_id: attempt.attempt_id,
          p_payment_id: verified.id,
          p_event_id: eventId,
          p_provider_event_at: providerEventAt
        }
      );

      if (error) throw error;
    }


    async function recordVerifiedRecurringCapture() {
      if (attempt.target_type !== 'subscription_invoice') return;

      if (
        verified.status !== 'captured' ||
        verified.id !== payment.id ||
        verified.order_id !== payment.order_id ||
        verified.currency !== attempt.currency ||
        Number(verified.amount) !== Number(attempt.amount_paise)
      ) {
        throw new Error('Recurring payment verification mismatch');
      }

      const { data: invoice, error: invoiceError } = await backend
        .from('subscription_invoices')
        .select('invoice_kind')
        .eq('id', attempt.target_id)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      if (!invoice || invoice.invoice_kind !== 'delivery') return;

      const { data: decision, error } = await backend.rpc(
        'record_verified_recurring_capture',
        {
          p_attempt_id: attempt.attempt_id,
          p_payment_id: verified.id
        }
      );

      if (error) throw error;

      console.log('Recurring capture verification:', {
        attemptId: attempt.attempt_id,
        decision
      });
    }

    if (attempt.status === 'captured') {
      if (attempt.provider_payment_id !== verified.id) {
        return respond(503, { error: 'Conflicting payment' });
      }

      if (attempt.target_type === 'one_time_order') {
        const { data: outcome, error: outcomeError } =
          await backend.rpc('settle_one_time_razorpay_payment', {
            p_attempt_id: attempt.attempt_id,
            p_payment_id: verified.id
          });

        if (outcomeError) {
          console.error('One-time payment recovery failed:',
            outcomeError.message);
          return respond(503, {
            error: 'Payment reconciliation required'
          });
        }

        if (String(outcome).startsWith('REFUND_REQUIRED:')) {
          return respond(200, {
            received: true,
            refund_required: true
          });
        }

        return respond(200, {
          received: true,
          duplicate: true
        });
      }

      if (attempt.target_type === 'subscription_invoice') {
        const { error: recoveryError } = await backend.rpc(
          'settle_razorpay_payment',
          {
            p_attempt_id: attempt.attempt_id,
            p_payment_id: verified.id,
            p_event_id: eventId
          }
        );

        if (recoveryError) {
          console.error('Subscription recovery failed:', recoveryError.message);
          return respond(503, { error: 'Payment reconciliation required' });
        }
      }

      await recordRecurringEventEvidence();
      await recordVerifiedRecurringCapture();
      return respond(200, { received: true, duplicate: true });
    }

    let rpcName;
    let rpcArguments;

    if (attempt.target_type === 'one_time_order') {
      rpcName = 'settle_one_time_razorpay_payment';
      rpcArguments = {
        p_attempt_id: attempt.attempt_id,
        p_payment_id: verified.id
      };
    } else if (attempt.target_type === 'subscription_invoice') {
      rpcName = 'settle_razorpay_payment';
      rpcArguments = {
        p_attempt_id: attempt.attempt_id,
        p_payment_id: verified.id,
        p_event_id: eventId
      };
    } else {
      console.error('Unsupported payment target:', attempt.target_type);
      return respond(503, { error: 'Payment reconciliation required' });
    }

    const { data: settlementResult, error: settlementError } =
      await backend.rpc(rpcName, rpcArguments);

    if (settlementError) {
      console.error(
        'Payment settlement failed:',
        settlementError.code,
        settlementError.message
      );

      return respond(503, { error: 'Payment settlement pending' });
    }

    await recordRecurringEventEvidence();
    await recordVerifiedRecurringCapture();

    if (
      attempt.target_type === 'one_time_order' &&
      String(settlementResult).startsWith('REFUND_REQUIRED:')
    ) {
      console.log('Manual refund review recorded:', {
        attemptId: attempt.attempt_id,
        eventId
      });

      return respond(200, {
        received: true,
        refund_required: true
      });
    }

    console.log('Razorpay payment settled:', {
      attemptId: attempt.attempt_id,
      targetType: attempt.target_type,
      eventId
    });

    return respond(200, { received: true, settled: true });

  } catch (error) {
    console.error('Webhook processing error:', error.message);
    return respond(503, { error: 'Webhook processing unavailable' });
  }
}

module.exports = { handleRazorpayWebhook };
