'use strict';

const { getPaymentConfig } = require('./paymentConfig');

const RAZORPAY_API = 'https://api.razorpay.com/v1';

const ORDER_ID_PATTERN = /^order_[A-Za-z0-9]+$/;
const PAYMENT_ID_PATTERN = /^pay_[A-Za-z0-9]+$/;

function isValidAmount(value) {
  return Number.isSafeInteger(value) && value > 0;
}

async function razorpayGet(path) {
  const paymentConfig = getPaymentConfig();

  if (!paymentConfig.enabled) {
    throw new Error('Payment reconciliation unavailable');
  }

  const { keyId, keySecret } = paymentConfig;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials unavailable');
  }

  const authorization = Buffer.from(
    `${keyId}:${keySecret}`
  ).toString('base64');

  const response = await fetch(`${RAZORPAY_API}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${authorization}`,
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(
      `Razorpay verification failed: HTTP ${response.status}`
    );
  }

  return response.json();
}

async function reconcileOneTimePayment({
  providerOrderId,
  expectedAmountPaise
}) {
  if (!ORDER_ID_PATTERN.test(providerOrderId || '')) {
    throw new Error('Invalid Razorpay order ID');
  }

  if (!isValidAmount(expectedAmountPaise)) {
    throw new Error('Invalid expected amount');
  }

  // Retrieve the provider order independently.
  const order = await razorpayGet(
    `/orders/${encodeURIComponent(providerOrderId)}`
  );

  if (
    order.id !== providerOrderId ||
    order.currency !== 'INR' ||
    order.amount !== expectedAmountPaise
  ) {
    throw new Error('Razorpay order verification mismatch');
  }

  // Retrieve every payment associated with this order.
  // Do not assume the first payment is the successful one.
  const payments = [];
  const pageSize = 100;
  let skip = 0;

  while (true) {
    const result = await razorpayGet(
      `/orders/${encodeURIComponent(providerOrderId)}` +
      `/payments?count=${pageSize}&skip=${skip}`
    );

    if (
      !Array.isArray(result.items) ||
      !Number.isSafeInteger(result.count) ||
      result.count !== result.items.length
    ) {
      throw new Error('Invalid Razorpay payments response');
    }

    if (
      result.items.length > pageSize ||
      (result.items.length === 0 && skip > 0)
    ) {
      throw new Error('Unexpected Razorpay payment page');
    }

    payments.push(...result.items);

    if (result.items.length < pageSize) {
      // A short page is only sufficient when the provider
      // response explicitly confirms there are no more items.
      if (
        Number.isSafeInteger(result.total_count) &&
        payments.length < result.total_count
      ) {
        throw new Error(
          'Incomplete Razorpay payment pagination'
        );
      }

      break;
    }

    skip += pageSize;

    // Never make an expiry decision from incomplete pagination.
    if (skip >= 1000) {
      throw new Error('Payment pagination limit reached');
    }
  }

  let capturedPayment = null;
  let authorizedPayment = null;
  let hasUncertainPayment = false;

  for (const payment of payments) {
    if (
      !PAYMENT_ID_PATTERN.test(payment.id || '') ||
      payment.order_id !== providerOrderId ||
      payment.currency !== 'INR' ||
      !isValidAmount(payment.amount)
    ) {
      throw new Error('Invalid Razorpay payment record');
    }

    if (
      payment.status === 'refunded' ||
      payment.amount_refunded !== 0
    ) {
      return {
        status: 'requires_manual_reconciliation',
        providerOrderId,
        amountPaise: expectedAmountPaise
      };
    }

    if (payment.amount !== expectedAmountPaise) {
      hasUncertainPayment = true;
      continue;
    }

    if (payment.status === 'captured') {
      if (
        capturedPayment &&
        capturedPayment.id !== payment.id
      ) {
        throw new Error(
          'Multiple captured payments require manual reconciliation'
        );
      }

      capturedPayment = payment;
    } else if (payment.status === 'authorized') {
      authorizedPayment = payment;
    } else if (
      !['created', 'failed', 'refunded'].includes(payment.status)
    ) {
      hasUncertainPayment = true;
    }
  }

  if (capturedPayment) {
    return {
      status: 'captured',
      paymentId: capturedPayment.id,
      providerOrderId,
      amountPaise: expectedAmountPaise
    };
  }

  if (authorizedPayment) {
    return {
      status: 'authorized',
      paymentId: authorizedPayment.id,
      providerOrderId,
      amountPaise: expectedAmountPaise
    };
  }

  if (hasUncertainPayment) {
    return {
      status: 'uncertain',
      providerOrderId,
      amountPaise: expectedAmountPaise
    };
  }

  // This is only a provider-side snapshot.
  // It is NOT permission to release stock.
  return {
    status: 'no_captured_payment_observed',
    providerOrderId,
    amountPaise: expectedAmountPaise,
    checkedAt: new Date().toISOString()
  };
}

module.exports = {
  reconcileOneTimePayment
};
