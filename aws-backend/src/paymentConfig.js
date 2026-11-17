'use strict';

const FUNCTION_ENVIRONMENTS = Object.freeze({
  'srivari-milk-farms-checkout-test': 'test',
  'srivari-Milk-Farms': 'live'
});

function getPaymentConfig(env = process.env) {
  const environment = env.PAYMENT_ENVIRONMENT;
  const expectedEnvironment =
    FUNCTION_ENVIRONMENTS[env.AWS_LAMBDA_FUNCTION_NAME];

  const disabled = reason => ({
    enabled: false,
    environment: environment || null,
    reason
  });

  if (!expectedEnvironment ||
      environment !== expectedEnvironment) {
    return disabled('Payment environment mismatch');
  }

  if (env.ENABLE_RAZORPAY_PAYMENTS !== 'true') {
    return disabled('Online payments disabled');
  }

  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  if (!keyId || !keySecret || !webhookSecret) {
    return disabled('Payment credentials incomplete');
  }

  const expectedPrefix = environment === 'test'
    ? 'rzp_test_'
    : 'rzp_live_';

  if (!keyId.startsWith(expectedPrefix)) {
    return disabled('Payment credential mode mismatch');
  }

  return {
    enabled: true,
    environment,
    keyId,
    keySecret,
    webhookSecret
  };
}

module.exports = { getPaymentConfig };
