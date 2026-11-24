'use strict';

const sender = require('./whatsappSender');

const ADMIN_PHONE = '+917353730673';

async function finish(db, job, values) {
  const { data, error } = await db
    .from('admin_notification_queue')
    .update({
      ...values,
      lock_token: null,
      locked_at: null
    })
    .eq('id', job.id)
    .eq('status', 'processing')
    .eq('lock_token', job.lock_token)
    .select('id')
    .single();

  if (error || !data) {
    throw new Error('ADMIN_QUEUE_UPDATE_FAILED');
  }
}

async function eligibility(db) {
  const { data: settings, error } = await db
    .from('admin_notification_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) throw new Error('ADMIN_SETTINGS_FAILED');

  if (
    settings.enabled !== true ||
    settings.recipient_phone !== ADMIN_PHONE
  ) {
    return { enabled: false };
  }

  const { data: stop, error: stopError } = await db
    .from('whatsapp_checkout_stop')
    .select('stopped_at')
    .eq('phone', ADMIN_PHONE)
    .maybeSingle();

  if (stopError) {
    throw new Error('ADMIN_CONSENT_CHECK_FAILED');
  }

  const { data: events, error: eventError } = await db
    .from('whatsapp_webhook_events')
    .select('payload,received_at')
    .eq('event_type', 'incoming_message')
    .eq('payload->>from', ADMIN_PHONE.slice(1))
    .order('received_at', { ascending: false })
    .limit(100);

  if (eventError) {
    throw new Error('ADMIN_WINDOW_CHECK_FAILED');
  }

  const now = Date.now();

  const validEvents = (events || [])
    .map(event => ({
      timestamp: Number(event.payload?.timestamp) * 1000,
      stopped: event.payload?.opt_out === true
    }))
    .filter(event =>
      Number.isFinite(event.timestamp) &&
      event.timestamp > 0 &&
      event.timestamp <= now
    )
    .sort((a, b) =>
      b.timestamp - a.timestamp ||
      Number(b.stopped) - Number(a.stopped)
    );

  const latest = validEvents[0];

  const stoppedAt = stop?.stopped_at
    ? Date.parse(stop.stopped_at)
    : 0;

  const consentAt = Date.parse(
    '2026-11-24T17:22:36.799374Z'
  );

  const webhookStopAt = validEvents
    .filter(event => event.stopped)
    .reduce(
      (latest, event) =>
        Math.max(latest, event.timestamp),
      0
    );

  if (
    stoppedAt >= consentAt ||
    webhookStopAt >= consentAt ||
    latest?.stopped
  ) {
    return {
      enabled: true,
      consent: false
    };
  }

  return {
    enabled: true,
    consent: true,
    free: Boolean(
      latest &&
      now - latest.timestamp < 86100000
    ),
    paid: settings.paid_enabled === true
  };
}

async function processJob(db, job) {
  let sending = false;
  let mode = null;

  try {
    const allowed = await eligibility(db);

    if (!allowed.enabled) {
      await finish(db, job, {
        status: 'pending',
        next_attempt_at: new Date(
          Date.now() + 300000
        ).toISOString()
      });
      return 'pending';
    }

    if (!allowed.consent) {
      await finish(db, job, {
        status: 'cancelled',
        last_error: 'Admin opted out'
      });
      return 'cancelled';
    }

    const notification = {
      ...job,
      recipient_phone: ADMIN_PHONE,
      language_code: 'en'
    };

    if (allowed.free) {
      mode = 'free';
    } else {
      if (!allowed.paid) {
        await finish(db, job, {
          status: 'pending',
          next_attempt_at: new Date(
            Date.now() + 3600000
          ).toISOString(),
          last_error: 'Paid sending disabled'
        });
        return 'pending';
      }

      sender.buildTemplateMessage(notification);

      const { data, error } = await db.rpc(
        'admin_notification_reserve_paid'
      );

      if (error) {
        throw new Error('ADMIN_BUDGET_CHECK_FAILED');
      }

      if (data !== true) {
        await finish(db, job, {
          status: 'budget_held',
          last_error: 'Daily paid limit reached or disabled'
        });
        return 'budget_held';
      }

      mode = 'paid';
    }

    const finalCheck = await eligibility(db);

    if (
      !finalCheck.enabled ||
      !finalCheck.consent ||
      (mode === 'free' && !finalCheck.free) ||
      (mode === 'paid' && !finalCheck.paid)
    ) {
      await finish(db, job, {
        status: 'pending',
        next_attempt_at: new Date(
          Date.now() + 3600000
        ).toISOString(),
        last_error: 'Sending eligibility changed'
      });
      return 'pending';
    }

    const { data: marked, error: markError } = await db
      .from('admin_notification_queue')
      .update({ send_mode: mode })
      .eq('id', job.id)
      .eq('status', 'processing')
      .eq('lock_token', job.lock_token)
      .select('id')
      .single();

    if (markError || !marked) {
      throw new Error('ADMIN_SEND_MODE_UPDATE_FAILED');
    }

    sending = true;

    const result = mode === 'free'
      ? await sender.sendAdminText(
          ADMIN_PHONE,
          job.message_body,
          job.id
        )
      : await sender.sendTemplate(notification);

    await finish(db, job, {
      status: 'sent',
      send_mode: mode,
      provider_message_id: result.provider_message_id,
      sent_at: new Date().toISOString(),
      last_error: null
    });

    return 'sent';

  } catch (error) {

    const uncertain = sending && (
      error.uncertain ||
      error.message !== 'WHATSAPP_API_REJECTED'
    );

    // Never automatically retry paid or ambiguous sends.
    const retryable =
      !uncertain &&
      mode !== 'paid' &&
      job.attempt_count < 3 &&
      (!sending || error.retryable === true);

    const status = uncertain
      ? 'uncertain'
      : retryable
        ? 'pending'
        : 'failed';

    await finish(db, job, {
      status,
      send_mode: mode,
      last_error: String(
        error.message || 'ADMIN_NOTIFICATION_FAILED'
      ).slice(0, 200),
      ...(retryable ? {
        next_attempt_at: new Date(
          Date.now() + 300000
        ).toISOString()
      } : {})
    });

    return status;
  }
}

async function processAdminNotifications(db, context) {
  if (!sender.enabled()) {
    return { skipped: true };
  }

  const results = {};

  for (let i = 0; i < 5; i++) {

    if (
      context?.getRemainingTimeInMillis &&
      context.getRemainingTimeInMillis() < 35000
    ) {
      break;
    }

    const { data, error } = await db.rpc(
      'admin_notification_claim'
    );

    if (error) {
      throw new Error('ADMIN_NOTIFICATION_CLAIM_FAILED');
    }

    if (!data?.length) break;

    const status = await processJob(db, data[0]);

    results[status] = (results[status] || 0) + 1;
  }

  return results;
}

module.exports = {
  processAdminNotifications
};
