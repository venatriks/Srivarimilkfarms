'use strict';

const { createClient } = require('@supabase/supabase-js');
const sender = require('./whatsappSender');
const { renderWhatsAppDocument } = require('./invoiceService');

function backendClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

async function finish(db, job, values) {
  const { data, error } = await db
    .from('whatsapp_notification_queue')
    .update({
      ...values,
      locked_at: null,
      lock_token: null
    })
    .eq('id', job.id)
    .eq('status', 'processing')
    .eq('lock_token', job.lock_token)
    .select('id')
    .single();

  if (error || !data) {
    throw new Error('WHATSAPP_QUEUE_UPDATE_FAILED');
  }
}


async function finalEligibility(db, job) {
  if (job.source_type === 'one_time_order_checkout') {
    const { data, error } = await db.rpc(
      'whatsapp_checkout_job_allowed',
      { p_job_id: job.id }
    );

    if (error) {
      throw new Error('WHATSAPP_CONSENT_CHECK_FAILED');
    }

    return data === true;
  }

  const { data: verified, error } = await db.rpc(
    'whatsapp_has_verified_consent',
    {
      p_phone_number: job.recipient_phone,
      p_customer_id: job.customer_id,
      p_guest_order_id: null
    }
  );

  if (error) {
    throw new Error('WHATSAPP_CONSENT_CHECK_FAILED');
  }

  if (!job.customer_id || verified !== true) {
    return false;
  }

  const { data: preference, error: prefError } = await db
    .from('whatsapp_preferences')
    .select('opted_in,customer_id,language_code')
    .eq('phone_number', job.recipient_phone)
    .maybeSingle();

  if (prefError) {
    throw new Error('WHATSAPP_CONSENT_CHECK_FAILED');
  }

  if (
    !preference?.opted_in ||
    preference.customer_id !== job.customer_id
  ) {
    return false;
  }

  if (![
    'smf_payment_due',
    'smf_renewal_reminder'
  ].includes(job.template_name)) {
    return true;
  }

  const istDate = value => {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) return null;

    return new Date(
      date.getTime() + 19800000
    ).toISOString().slice(0, 10);
  };

  const addDays = (date, days) => {
    const value = new Date(date + 'T00:00:00Z');

    value.setUTCDate(value.getUTCDate() + days);

    return value.toISOString().slice(0, 10);
  };

  const today = istDate(Date.now());

  if (istDate(job.created_at) !== today) {
    return false;
  }

  if (job.template_name === 'smf_payment_due') {
    const { data: invoice, error: invoiceError } = await db
      .from('subscription_invoices')
      .select(
        'subscription_id,customer_id,status,billing_type,' +
        'amount_due_paise,payment_due_at'
      )
      .eq('id', job.source_id)
      .maybeSingle();

    if (invoiceError) {
      throw new Error('WHATSAPP_REMINDER_CHECK_FAILED');
    }

    if (
      !invoice ||
      invoice.customer_id !== job.customer_id ||
      invoice.status !== 'pending' ||
      !['prepaid', 'postpaid'].includes(invoice.billing_type) ||
      Number(invoice.amount_due_paise) <= 0 ||
      !invoice.payment_due_at
    ) {
      return false;
    }

    const dueDate = istDate(invoice.payment_due_at);

    return (
      [today, addDays(today, 1)].includes(dueDate) &&
      String(job.template_parameters?.[0]) ===
        String(invoice.subscription_id) &&
      String(job.template_parameters?.[1]) ===
        (Number(invoice.amount_due_paise) / 100).toFixed(2)
    );
  }

  const { data: subscription, error: subscriptionError } =
    await db
      .from('subscriptions')
      .select(
        'id,user_id,status,approval_status,' +
        'billing_type,start_date,plan_days'
      )
      .eq('id', job.source_id)
      .maybeSingle();

  if (subscriptionError) {
    throw new Error('WHATSAPP_REMINDER_CHECK_FAILED');
  }

  if (
    !subscription ||
    subscription.user_id !== job.customer_id ||
    subscription.approval_status !== 'Approved' ||
    !['Active', 'Paused'].includes(subscription.status) ||
    !['prepaid', 'postpaid'].includes(subscription.billing_type)
  ) {
    return false;
  }

  const { data: entitlement, error: entitlementError } =
    await db
      .from('subscription_entitlements')
      .select('calendar_period_end')
      .eq('subscription_id', subscription.id)
      .order('calendar_period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

  if (entitlementError) {
    throw new Error('WHATSAPP_REMINDER_CHECK_FAILED');
  }

  let expiry = entitlement?.calendar_period_end;

  if (!expiry) {
    if (!subscription.start_date || !subscription.plan_days) {
      return false;
    }

    expiry = addDays(
      subscription.start_date,
      Number(subscription.plan_days) - 1
    );
  }

  return (
    expiry === addDays(today, 3) &&
    String(job.template_parameters?.[0]) ===
      String(subscription.id) &&
    String(job.template_parameters?.[1]) ===
      expiry.split('-').reverse().join('-')
  );
}

async function processNotification(db, job) {
  let sending = false;

  try {
    let language = job.language_code;

    if (job.source_type === 'one_time_order_checkout') {
      const { data, error } = await db.rpc(
        'whatsapp_checkout_job_allowed',
        { p_job_id: job.id }
      );

      if (error) {
        throw new Error('WHATSAPP_CONSENT_CHECK_FAILED');
      }

      if (data !== true) {
        await finish(db, job, {
          status: 'cancelled',
          last_error: 'Checkout consent unavailable'
        });
        return 'cancelled';
      }
    } else {

    const { data: preference, error } = await db
      .from('whatsapp_preferences')
      .select('customer_id,opted_in,language_code')
      .eq('phone_number', job.recipient_phone)
      .maybeSingle();

    if (error) {
      throw new Error('WHATSAPP_CONSENT_CHECK_FAILED');
    }

    if (
      !preference?.opted_in ||
      preference.customer_id !== job.customer_id
    ) {
      await finish(db, job, {
        status: 'cancelled',
        last_error: 'Consent unavailable'
      });

      return 'cancelled';
    }

    const { data: verified, error: consentError } =
      await db.rpc('whatsapp_has_verified_consent', {
        p_phone_number: job.recipient_phone,
        p_customer_id: job.customer_id,
        p_guest_order_id: null
      });

    if (consentError) {
      throw new Error('WHATSAPP_VERIFICATION_CHECK_FAILED');
    }

    if (!job.customer_id || verified !== true) {
      await finish(db, job, {
        status: 'cancelled',
        last_error: 'Verified customer consent unavailable'
      });
      return 'cancelled';
    }

    language = preference.language_code;
    }

    if (!(await finalEligibility(db, job))) {
      await finish(db, job, {
        status: 'cancelled',
        last_error: 'Consent or reminder eligibility changed'
      });

      return 'cancelled';
    }

    let document = null;

    if (job.document_type ||
        job.template_name.endsWith('_pdf')) {

      const generated = await renderWhatsAppDocument(db, job);

      if (!(await finalEligibility(db, job))) {
        await finish(db, job, {
          status: 'cancelled',
          last_error: 'Consent changed before PDF upload'
        });

        return 'cancelled';
      }

      const mediaId = await sender.uploadPDF(
        generated.pdf,
        generated.filename
      );

      document = {
        id: mediaId,
        filename: generated.filename
      };
    }

    const notification = {
      ...job,
      language_code: language
    };

    // Validate before contacting Meta.
    sender.buildTemplateMessage(notification, document);

    const { error: historyError } = await db
      .from('whatsapp_message_history')
      .insert({
        notification_id: job.id,
        attempt_number: job.attempt_count,
        recipient_phone: job.recipient_phone,
        template_name: job.template_name,
        status: 'uncertain'
      });

    if (historyError) {
      throw new Error('WHATSAPP_HISTORY_INSERT_FAILED');
    }

    if (!(await finalEligibility(db, job))) {
      const { error: cancelHistoryError } = await db
        .from('whatsapp_message_history')
        .update({
          status: 'failed',
          error_message: 'Cancelled before sending'
        })
        .eq('notification_id', job.id)
        .eq('attempt_number', job.attempt_count);

      if (cancelHistoryError) {
        console.error('WhatsApp cancellation history update failed');
      }

      await finish(db, job, {
        status: 'cancelled',
        last_error: 'Consent or reminder eligibility changed'
      });

      return 'cancelled';
    }

    sending = true;

    const result = await sender.sendTemplate(notification, document);

    const acceptedAt = new Date().toISOString();

    const { error: updateError } = await db
      .from('whatsapp_message_history')
      .update({
        provider_message_id: result.provider_message_id,
        status: 'accepted'
      })
      .eq('notification_id', job.id)
      .eq('attempt_number', job.attempt_count);

    if (updateError) {
      throw new Error('WHATSAPP_HISTORY_UPDATE_FAILED');
    }

    await finish(db, job, {
      status: 'sent',
      sent_at: acceptedAt,
      last_error: null
    });

    return 'accepted';

  } catch (error) {
    const rejected =
      error.message === 'WHATSAPP_API_REJECTED';

    const uncertain = Boolean(
      sending && (error.uncertain || !rejected)
    );

    const retryable =
      !uncertain &&
      (
        error.retryable === true ||
        (!sending && error.uncertain === true)
      ) &&
      job.attempt_count < job.max_attempts;

    const status = uncertain
      ? 'uncertain'
      : retryable
        ? 'pending'
        : 'failed';

    const message = String(
      error.message || 'WHATSAPP_FAILED'
    ).slice(0, 200);

    if (sending) {
      const { error: historyError } = await db
        .from('whatsapp_message_history')
        .update({
          status: uncertain ? 'uncertain' : 'failed',
          error_code: error.providerCode
            ? String(error.providerCode)
            : null,
          error_message: message
        })
        .eq('notification_id', job.id)
        .eq('attempt_number', job.attempt_count)
        .is('provider_message_id', null);

      if (historyError) {
        console.error('WhatsApp history update failed');
      }
    }

    await finish(db, job, {
      status,
      last_error: message,
      ...(retryable ? {
        next_attempt_at: new Date(
          Date.now() + 300000
        ).toISOString()
      } : {})
    });

    return status;
  }
}

async function processWhatsAppNotifications(options = {}) {
  if (!sender.enabled()) {
    return { skipped: true, reason: 'disabled' };
  }

  const db = backendClient();

  const limit = Math.min(
    5,
    Math.max(1, Number(options.limit) || 1)
  );

  const results = {};

  for (let index = 0; index < limit; index++) {
    if (
      options.context?.getRemainingTimeInMillis &&
      options.context.getRemainingTimeInMillis() < 35000
    ) {
      break;
    }

    const { data, error } = await db.rpc(
      'whatsapp_claim_notifications',
      { p_limit: 1 }
    );

    if (error) {
      throw new Error('WHATSAPP_QUEUE_CLAIM_FAILED');
    }

    if (!data?.length) break;

    const status = await processNotification(db, data[0]);

    results[status] = (results[status] || 0) + 1;
  }

  return results;
}

module.exports = { processWhatsAppNotifications };
