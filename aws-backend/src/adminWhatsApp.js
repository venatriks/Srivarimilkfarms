'use strict';

const { createClient } = require('@supabase/supabase-js');
const { sendAdminText } = require('./whatsappSender');

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handleAdminWhatsApp = async (event, headers) => {
  const reply = (statusCode, data) => ({
    statusCode,
    headers: {
      ...headers,
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(data)
  });

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

    const token = Object.entries(event.headers || {})
      .find(([k]) => k.toLowerCase() === 'authorization')
      ?.[1]?.match(/^Bearer (.+)$/i)?.[1];

    if (!token) {
      return reply(401, { error: 'Unauthorized' });
    }

    const { data: auth, error: ae } =
      await db.auth.getUser(token);

    if (ae || !auth.user) {
      return reply(401, { error: 'Unauthorized' });
    }

    const { data: profile, error: pe } = await db
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .single();

    if (pe || profile?.role !== 'admin') {
      return reply(403, { error: 'Forbidden' });
    }

    const method =
      event.requestContext?.http?.method ||
      event.httpMethod;

    if (method !== 'POST') {
      return reply(405, { error: 'Method not allowed' });
    }

    let b;

    try {
      b = JSON.parse(event.body || '{}');
    } catch {
      return reply(400, { error: 'Invalid JSON' });
    }

    if (!b || typeof b !== 'object') {
      return reply(400, { error: 'Invalid request' });
    }

    if (b.action === 'list') {
      const { data, error } =
        await db.rpc('admin_whatsapp_eligible');

      if (error) throw error;

      const { data: history, error: he } = await db
        .from('admin_whatsapp_messages')
        .select(
          'id,phone,body,status,created_at,provider_message_id'
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (he) throw he;

      return reply(200, {
        recipients: data,
        history
      });
    }

    if (
      b.action !== 'send' ||
      !UUID.test(b.id || '') ||
      !UUID.test(b.customer_id || '') ||
      typeof b.body !== 'string' ||
      !b.body.trim() ||
      b.body.length > 4096
    ) {
      return reply(400, { error: 'Invalid message' });
    }

    const { data: eligible, error: ee } =
      await db.rpc('admin_whatsapp_eligible');

    if (ee) throw ee;

    const recipient = eligible.find(
      x =>
        x.customer_id === b.customer_id &&
        x.phone === b.phone
    );

    if (!recipient) {
      return reply(409, {
        error: 'Customer not eligible or service window closed'
      });
    }

    const { error: ie } = await db
      .from('admin_whatsapp_messages')
      .insert({
        id: b.id,
        admin_id: auth.user.id,
        customer_id: recipient.customer_id,
        phone: recipient.phone,
        body: b.body.trim()
      });

    if (ie) {
      if (ie.code === '23505') {
        return reply(409, {
          error: 'Message already submitted; check history'
        });
      }

      throw ie;
    }

    let status = 'accepted';
    let provider_message_id = null;

    try {
      const result = await sendAdminText(
        recipient.phone,
        b.body.trim(),
        b.id
      );

      provider_message_id = result.provider_message_id;
    } catch (e) {
      status = e.uncertain ? 'uncertain' : 'failed';
    }

    const { error: ue } = await db
      .from('admin_whatsapp_messages')
      .update({
        status,
        provider_message_id
      })
      .eq('id', b.id);

    if (ue) throw ue;

    return reply(200, { status });

  } catch {
    return reply(503, {
      error: 'Messaging unavailable; check history before retrying'
    });
  }
};
