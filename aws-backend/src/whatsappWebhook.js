'use strict';

const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

function reply(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body
  };
}

function secureEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));

  return (
    left.length === right.length &&
    crypto.timingSafeEqual(left, right)
  );
}

async function handleWhatsAppWebhook(event) {
  const method =
    event.requestContext?.http?.method ||
    event.httpMethod;

  // Meta webhook verification handshake.
  if (method === 'GET') {
    const query = event.queryStringParameters || {};
    const token = process.env.WHATSAPP_VERIFY_TOKEN;

    if (
      token &&
      query['hub.mode'] === 'subscribe' &&
      secureEqual(query['hub.verify_token'], token) &&
      typeof query['hub.challenge'] === 'string' &&
      /^\d+$/.test(query['hub.challenge'])
    ) {
      return reply(200, query['hub.challenge']);
    }

    return reply(403, 'Forbidden');
  }

  if (method !== 'POST') {
    return reply(405, 'Method not allowed');
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    return reply(503, 'Unavailable');
  }

  const rawBody = Buffer.from(
    event.body || '',
    event.isBase64Encoded ? 'base64' : 'utf8'
  );

  if (rawBody.length > 1024 * 1024) {
    return reply(413, 'Payload too large');
  }

  const signature = Object.entries(event.headers || {})
    .find(([name]) =>
      name.toLowerCase() === 'x-hub-signature-256'
    )?.[1];

  const expected = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  if (!secureEqual(signature, expected)) {
    return reply(403, 'Invalid signature');
  }

  let payload;

  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return reply(400, 'Invalid JSON');
  }

  if (
    payload?.object !== 'whatsapp_business_account' ||
    !Array.isArray(payload.entry)
  ) {
    return reply(400, 'Invalid event');
  }

  const rows = [];
  const verifications = [];
  const expectedWaba =
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const expectedPhone =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!expectedWaba || !expectedPhone) {
    return reply(503, 'Unavailable');
  }

  function addEvent(type, item) {
    if (!item || typeof item.id !== 'string') return;

    const eventKey = crypto
      .createHash('sha256')
      .update(JSON.stringify([
        expectedPhone,
        type,
        item.id,
        item.status || '',
        item.timestamp || ''
      ]))
      .digest('hex');

    // Store only fields needed for event processing.
    const details = type === 'message_status'
      ? {
          id: item.id,
          status: item.status,
          timestamp: item.timestamp,
          recipient_id: item.recipient_id,
          errors: (item.errors || []).map(e => ({
            code: e.code
          }))
        }
      : {
          id: item.id,
          from: item.from,
          timestamp: item.timestamp,
          type: item.type,
          opt_out: /^(stop|unsubscribe|opt out)$/i.test(
            String(item.text?.body || '').trim()
          )
        };

    rows.push({
      event_key: eventKey,
      event_type: type,
      provider_message_id: item.id,
      phone_number_id: expectedPhone,
      payload: details,
      processing_status: 'pending'
    });
  }

  for (const entry of payload.entry) {
    if (String(entry.id) !== expectedWaba) continue;

    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;

      const value = change.value || {};

      if (
        String(value.metadata?.phone_number_id)
        !== expectedPhone
      ) continue;

      for (const item of value.statuses || []) {
        addEvent('message_status', item);
      }

      for (const item of value.messages || []) {
        const code = /^VERIFY ([a-f0-9]{32})$/i.exec(String(item.text?.body || '').trim());
        if (item.type === 'text' && code && /^[1-9]\d{7,14}$/.test(item.from || '')) {
          verifications.push({p_phone:'+'+item.from,p_hash:crypto.createHash('sha256').update(code[1].toLowerCase()).digest('hex')});
        }
        addEvent('incoming_message', item);
      }
    }
  }

  if (rows.length) {
    try {
      const db = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );

      for (const row of rows) {
        if (
          row.event_type !== 'incoming_message' ||
          row.payload.opt_out !== true ||
          !/^[1-9]\d{7,14}$/.test(row.payload.from || '')
        ) continue;

        const timestamp = Number(row.payload.timestamp);
        if (!Number.isSafeInteger(timestamp) ||
            timestamp <= 0 ||
            timestamp > Math.floor(Date.now() / 1000)) continue;

        const { error } = await db.rpc(
          'whatsapp_opt_out',
          {
            p_phone: '+' + row.payload.from,
            p_event_at: new Date(timestamp * 1000).toISOString()
          }
        );

        if (error) return reply(503, 'Retry later');
      }

      for (const verification of verifications) {
        const {error} = await db.rpc('whatsapp_accept_customer_verification',verification);
        if (error) return reply(503,'Retry later');
      }
      const unique = [...new Map(
        rows.map(row => [row.event_key, row])
      ).values()];

      const { error } = await db
        .from('whatsapp_webhook_events')
        .upsert(unique, {
          onConflict: 'event_key',
          ignoreDuplicates: true
        });

      if (error) {
        console.error(
          'WhatsApp event storage failed',
          error.code
        );
        return reply(503, 'Retry later');
      }
    } catch {
      return reply(503, 'Retry later');
    }
  }

  return reply(200, 'EVENT_RECEIVED');
}

module.exports = { handleWhatsAppWebhook };
