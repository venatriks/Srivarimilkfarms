
'use strict';

const { createClient } = require('@supabase/supabase-js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const respond = (statusCode, body, headers) => ({
    statusCode,
    headers,
    body: JSON.stringify(body)
});

async function handleCreateSubscriptionPaymentOrder(event, headers) {
    if (process.env.ENABLE_RAZORPAY_TEST_ROUTES !== 'true') {
        return respond(503, { error: 'Payment routes disabled' }, headers);
    }

    const {
        SUPABASE_URL: url,
        SUPABASE_ANON_KEY: anonKey,
        SUPABASE_SERVICE_ROLE_KEY: serviceKey,
        RAZORPAY_KEY_ID: keyId,
        RAZORPAY_KEY_SECRET: keySecret
    } = process.env;

    if (![url, anonKey, serviceKey, keyId, keySecret].every(Boolean)) {
        return respond(503, { error: 'Payment service unavailable' }, headers);
    }

    if (
        event.isBase64Encoded ||
        typeof event.body !== 'string' ||
        Buffer.byteLength(event.body, 'utf8') > 4096
    ) {
        return respond(400, { error: 'Invalid request body' }, headers);
    }

    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch {
        return respond(400, { error: 'Invalid JSON' }, headers);
    }

    if (
        !payload ||
        typeof payload !== 'object' ||
        Array.isArray(payload) ||
        !UUID.test(payload.subscription_id || '') ||
        !UUID.test(payload.idempotency_key || '')
    ) {
        return respond(400, {
            error: 'Valid subscription_id and idempotency_key are required'
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
            error: 'Sign in to pay for a subscription'
        }, headers);
    }

    const authClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } =
        await authClient.auth.getUser(bearer[1]);

    if (authError || !authData?.user?.id) {
        return respond(401, {
            error: 'Session expired. Please sign in again.'
        }, headers);
    }

    const customerId = authData.user.id;

    // Never attach the customer bearer token to this privileged client.
    const backend = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: subscription, error: subscriptionError } = await backend
        .from('subscriptions')
        .select('id,user_id,billing_type,status,approval_status')
        .eq('id', payload.subscription_id)
        .eq('user_id', customerId)
        .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    if (!subscription) {
        return respond(404, { error: 'Subscription not found' }, headers);
    }

    if (
        subscription.billing_type !== 'prepaid' ||
        subscription.status !== 'Paused' ||
        subscription.approval_status !== 'Pending'
    ) {
        return respond(409, {
            error: 'Subscription is not awaiting prepaid payment'
        }, headers);
    }

    // The database calculates the amount. Never trust a browser amount.
    const { data: invoiceData, error: invoiceError } = await backend.rpc(
        'create_prepaid_subscription_invoice',
        { p_subscription_id: subscription.id }
    );

    if (invoiceError) {
        console.error('Invoice creation failed:', invoiceError.code);
        return respond(409, {
            error: 'Unable to prepare prepaid invoice'
        }, headers);
    }

    const invoice = Array.isArray(invoiceData)
        ? invoiceData[0]
        : invoiceData;

    if (
        !invoice ||
        invoice.customer_id !== customerId ||
        invoice.status !== 'pending' ||
        !Number.isSafeInteger(Number(invoice.amount_due_paise)) ||
        Number(invoice.amount_due_paise) < 100
    ) {
        return respond(409, { error: 'Invoice is not payable' }, headers);
    }

    const { data: claimData, error: claimError } = await backend.rpc(
        'claim_invoice_payment_attempt',
        {
            p_invoice_id: invoice.id,
            p_customer_id: customerId,
            p_idempotency_key: payload.idempotency_key
        }
    );

    if (claimError) {
        console.error('Payment claim failed:', claimError.code);
        return respond(409, {
            error: 'Unable to claim payment attempt'
        }, headers);
    }

    const claim = Array.isArray(claimData) ? claimData[0] : claimData;

    if (
        !claim ||
        Number(claim.amount_paise) !== Number(invoice.amount_due_paise)
    ) {
        return respond(409, { error: 'Payment amount mismatch' }, headers);
    }

    // Safe retry: reuse an already attached Razorpay order.
    if (
        claim.provider_order_id &&
        ['created', 'authorized'].includes(claim.attempt_status)
    ) {
        return respond(200, {
            key_id: keyId,
            order_id: claim.provider_order_id,
            amount_paise: Number(claim.amount_paise),
            currency: 'INR',
            invoice_id: invoice.id
        }, headers);
    }

    // Never create another order if an earlier initiation is uncertain.
    if (claim.attempt_status !== 'initiated' || !claim.newly_claimed) {
        return respond(409, {
            error: 'Payment initiation requires reconciliation before retrying'
        }, headers);
    }

    const credentials = Buffer.from(
        `${keyId}:${keySecret}`
    ).toString('base64');

    let razorpayResponse;

    try {
        razorpayResponse = await fetch(
            'https://api.razorpay.com/v1/orders',
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: Number(claim.amount_paise),
                    currency: 'INR',
                    receipt: claim.attempt_id,
                    notes: { invoice_id: invoice.id }
                }),
                signal: AbortSignal.timeout(10000)
            }
        );
    } catch (error) {
        console.error('Razorpay order creation uncertain:', error.message);
        return respond(503, {
            error: 'Payment initiation requires reconciliation before retrying'
        }, headers);
    }

    if (!razorpayResponse.ok) {
        console.error('Razorpay order creation failed:', razorpayResponse.status);
        return respond(503, {
            error: 'Payment initiation unavailable'
        }, headers);
    }

    let order;
    try {
        order = await razorpayResponse.json();
    } catch {
        return respond(503, {
            error: 'Payment initiation requires reconciliation before retrying'
        }, headers);
    }

    if (
        !/^order_[A-Za-z0-9]+$/.test(order.id || '') ||
        order.currency !== 'INR' ||
        Number(order.amount) !== Number(claim.amount_paise)
    ) {
        return respond(503, {
            error: 'Razorpay order verification failed'
        }, headers);
    }

    const { error: attachError } = await backend.rpc(
        'attach_invoice_provider_order',
        {
            p_attempt_id: claim.attempt_id,
            p_customer_id: customerId,
            p_provider_order_id: order.id,
            p_amount_paise: Number(claim.amount_paise)
        }
    );

    if (attachError) {
        console.error('Razorpay order attachment failed:', attachError.code);
        return respond(503, {
            error: 'Payment initiation requires reconciliation before retrying'
        }, headers);
    }

    return respond(200, {
        key_id: keyId,
        order_id: order.id,
        amount_paise: Number(claim.amount_paise),
        currency: 'INR',
        invoice_id: invoice.id
    }, headers);
}

module.exports = { handleCreateSubscriptionPaymentOrder };
