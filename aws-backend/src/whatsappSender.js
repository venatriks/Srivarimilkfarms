'use strict';

const TEMPLATE_PARAMETERS = Object.freeze({
  smf_order_confirmation: 1,
  smf_order_cancellation: 1,
  smf_payment_confirmation: 2,
  smf_out_for_delivery: 1,
  smf_order_delivered: 1,
  smf_subscription_request: 1,
  smf_subscription_approval: 1,
  smf_subscription_rejection: 1,
  smf_subscription_paused: 1,
  smf_subscription_resumed: 1,
  smf_subscription_cancelled: 1,
  smf_renewal_reminder: 2,
  smf_payment_due: 2,
  smf_invoice_pdf: 1,
  smf_receipt_pdf: 1
});

const LANGUAGES = new Set(['en', 'te', 'kn']);

const DOCUMENT_TEMPLATES = new Set([
  'smf_invoice_pdf',
  'smf_receipt_pdf'
]);

function enabled() {
  return process.env.ENABLE_WHATSAPP_NOTIFICATIONS
    === 'true';
}

function settings() {
  if (!enabled()) {
    throw new Error('WHATSAPP_DISABLED');
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phone = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION;

  if (
    !token ||
    !/^\d+$/.test(phone || '') ||
    !/^v\d+\.\d+$/.test(version || '')
  ) {
    throw new Error('WHATSAPP_CONFIG_INVALID');
  }

  return {
    token,
    base: `https://graph.facebook.com/${version}/${phone}`
  };
}

async function request(endpoint, body, multipart = false) {
  const config = settings();

  const headers = {
    Authorization: `Bearer ${config.token}`
  };

  if (!multipart) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  let data;

  try {
    response = await fetch(
      `${config.base}/${endpoint}`,
      {
        method: 'POST',
        headers,
        body: multipart ? body : JSON.stringify(body),
        signal: AbortSignal.timeout(12000)
      }
    );

    data = await response.json();

  } catch {
    const error = new Error('WHATSAPP_OUTCOME_UNCERTAIN');
    error.uncertain = true;
    throw error;
  }

  if (!response.ok || data.error) {
    const error = new Error('WHATSAPP_API_REJECTED');

    error.providerCode = Number(data.error?.code) || null;
    error.httpStatus = response.status;
    error.uncertain = response.status >= 500;
    error.retryable = response.status === 429;

    throw error;
  }

  return data;
}

async function uploadPDF(pdf, filename) {
  if (
    !Buffer.isBuffer(pdf) ||
    pdf.length === 0 ||
    pdf.length > 5 * 1024 * 1024 ||
    pdf.subarray(0, 5).toString() !== '%PDF-'
  ) {
    throw new Error('WHATSAPP_INVALID_PDF');
  }

  const safeName = String(filename)
    .replace(/[^A-Za-z0-9_.-]/g, '_');

  const form = new FormData();

  form.append('messaging_product', 'whatsapp');
  form.append('type', 'application/pdf');

  form.append(
    'file',
    new Blob([pdf], {
      type: 'application/pdf'
    }),
    safeName
  );

  const result = await request('media', form, true);

  if (!result.id) {
    throw new Error('WHATSAPP_MEDIA_ID_MISSING');
  }

  return String(result.id);
}

function buildTemplateMessage(notification, document = null) {
  const template = notification.template_name;
  const language = notification.language_code;
  const phone = notification.recipient_phone;
  const parameters = notification.template_parameters;

  if (!Object.hasOwn(TEMPLATE_PARAMETERS, template)) {
    throw new Error('WHATSAPP_INVALID_TEMPLATE');
  }

  if (!LANGUAGES.has(language)) {
    throw new Error('WHATSAPP_INVALID_LANGUAGE');
  }

  if (!/^\+[1-9]\d{7,14}$/.test(phone || '')) {
    throw new Error('WHATSAPP_INVALID_PHONE');
  }

  if (
    !Array.isArray(parameters) ||
    parameters.length !== TEMPLATE_PARAMETERS[template]
  ) {
    throw new Error('WHATSAPP_INVALID_PARAMETERS');
  }

  const components = [];

  if (DOCUMENT_TEMPLATES.has(template)) {
    if (!document?.id || !document?.filename) {
      throw new Error('WHATSAPP_DOCUMENT_REQUIRED');
    }

    components.push({
      type: 'header',
      parameters: [{
        type: 'document',
        document: {
          id: String(document.id),
          filename: String(document.filename)
            .replace(/[^A-Za-z0-9_.-]/g, '_')
        }
      }]
    });
  }

  components.push({
    type: 'body',
    parameters: parameters.map(value => {
      if (
        !['string', 'number'].includes(typeof value) ||
        !String(value).trim() ||
        String(value).length > 256
      ) {
        throw new Error('WHATSAPP_INVALID_PARAMETER');
      }

      return {
        type: 'text',
        text: String(value).trim()
      };
    })
  });

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone.slice(1),
    type: 'template',
    biz_opaque_callback_data: notification.id,
    template: {
      name: template,
      language: {
        code: language
      },
      components
    }
  };
}

async function sendTemplate(notification, document = null) {
  const payload = buildTemplateMessage(
    notification,
    document
  );

  const result = await request('messages', payload);

  const messageId = result.messages?.[0]?.id;

  if (!messageId) {
    const error = new Error('WHATSAPP_MESSAGE_ID_MISSING');
    error.uncertain = true;
    throw error;
  }

  return {
    provider_message_id: String(messageId),
    status: 'accepted'
  };
}

module.exports = {
  enabled,
  uploadPDF,
  buildTemplateMessage,
  sendTemplate,
  TEMPLATE_PARAMETERS
};


module.exports.sendAdminText = async (phone, body, id) => {
  if (
    !/^\+[1-9]\d{7,14}$/.test(phone) ||
    typeof body !== 'string' ||
    !body.trim() ||
    body.length > 4096
  ) {
    throw new Error('INVALID_TEXT');
  }

  const result = await request('messages', {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone.slice(1),
    type: 'text',
    text: {
      body,
      preview_url: false
    },
    biz_opaque_callback_data: id
  });

  if (!result.messages?.[0]?.id) {
    const error = new Error('MISSING_MESSAGE_ID');
    error.uncertain = true;
    throw error;
  }

  return {
    provider_message_id: String(result.messages[0].id)
  };
};
