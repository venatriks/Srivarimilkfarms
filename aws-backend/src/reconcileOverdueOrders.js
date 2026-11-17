'use strict';

const { createClient } = require('@supabase/supabase-js');
const { getPaymentConfig } = require('./paymentConfig');
const {
  reconcileOneTimePayment
} = require('./reconcileOneTimePayment');

async function reconcileOverdueOrders(options = {}) {
  if (!getPaymentConfig().enabled) {
    throw new Error('Payment reconciliation disabled');
  }

  if (options.releaseUnattached === true) {
    throw new Error(
      'Stock cleanup disabled pending payment environment isolation'
    );
  }

  if (process.env.ENABLE_MODE_SAFE_RECONCILIATION !== 'true') {
    throw new Error(
      'Reconciliation disabled pending payment environment isolation'
    );
  }

  const releaseUnattached = false;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase configuration unavailable');
  }

  const backend = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await backend.rpc(
    'get_overdue_one_time_razorpay_orders',
    { p_limit: 1 }
  );

  if (error) throw error;

  const results = [];

  for (const order of data || []) {
    try {
      if (
        !order.provider_order_id ||
        !Number.isSafeInteger(Number(order.amount_paise))
      ) {
        results.push({
          orderId: order.order_id,
          status: 'requires_manual_reconciliation'
        });
        continue;
      }

      const reconciliation = await reconcileOneTimePayment({
        providerOrderId: order.provider_order_id,
        expectedAmountPaise: Number(order.amount_paise)
      });

      if (reconciliation.status === 'captured') {
        const { data: settlement, error: settlementError } =
          await backend.rpc('settle_one_time_razorpay_payment', {
            p_attempt_id: order.attempt_id,
            p_payment_id: reconciliation.paymentId
          });

        if (settlementError) throw settlementError;

        results.push({
          orderId: order.order_id,
          status: String(settlement).startsWith('REFUND_REQUIRED:')
            ? 'refund_required'
            : 'settled'
        });

        continue;
      }

      results.push({
        orderId: order.order_id,
        status: reconciliation.status
      });

    } catch (error) {
      console.error('Order reconciliation failed:', {
        orderId: order.order_id,
        message: error.message
      });

      results.push({
        orderId: order.order_id,
        status: 'reconciliation_failed'
      });
    }
  }

  let cleanup = {
    executed: false,
    expiredOrders: []
  };

  // Explicit manual invocation only.
  // Never release provider-attached orders through this cleanup.
  if (releaseUnattached) {
    const { data: expired, error: cleanupError } =
      await backend.rpc('expire_unattached_razorpay_orders', {
        p_older_than_minutes: 120,
        p_limit: 50
      });

    if (cleanupError) {
      throw new Error(
        'Unattached-order cleanup failed: ' + cleanupError.message
      );
    }

    cleanup = {
      executed: true,
      expiredOrders: expired || []
    };
  }

  return {
    processed: results.length,
    results,
    cleanup
  };
}

module.exports = {
  reconcileOverdueOrders
};
