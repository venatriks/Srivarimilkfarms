'use strict';

const { createClient } = require('@supabase/supabase-js');
const crypto = require('node:crypto');
const path = require('node:path');
const PDFDocument = require('pdfkit');

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GUEST_WINDOW = 30 * 60 * 1000;

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

function reply(headers, statusCode, body) {
  return {
    statusCode,
    headers: {
      ...headers,
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

async function getIdentity(event) {

  const header = Object.entries(event.headers || {})
    .find(([key]) => key.toLowerCase() === 'authorization');

  if (!header) return null;

  const match = /^Bearer\s+(\S+)$/i.exec(header[1]);

  if (!match) throw new Error('UNAUTHORIZED');

  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  const { data, error } =
    await client.auth.getUser(match[1]);

  if (error || !data?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  return {
    id: data.user.id,
    admin: data.user.app_metadata?.role === 'admin'
  };
}

async function rpc(db, name, args) {

  const { data, error } = await db.rpc(name, args);

  if (error) {
    console.error('Invoice RPC error:', name, error.code);
    throw new Error('INVOICE_UNAVAILABLE');
  }

  return data;
}

function canAccess(identity, customerId) {

  return Boolean(
    identity &&
    (
      identity.admin ||
      (
        customerId &&
        identity.id === customerId
      )
    )
  );
}

function money(paise) {
  return 'Rs. ' +
    (Number(paise || 0) / 100).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
}

function dateLabel(value) {

  if (!value) return '-';

  return new Date(value).toLocaleDateString(
    'en-IN',
    { timeZone: 'Asia/Kolkata' }
  );
}

async function getCurrentStatus(db, invoice) {

  if (invoice.one_time_order_id) {

    const { data, error } = await db
      .from('one_time_orders')
      .select('payment_status,status')
      .eq('id', invoice.one_time_order_id)
      .single();

    if (error || !data) {
      throw new Error('INVOICE_UNAVAILABLE');
    }

    return {
      payment: data.payment_status,
      order: data.status
    };
  }

  const { data, error } = await db
    .from('subscription_invoices')
    .select('status')
    .eq('id', invoice.subscription_invoice_id)
    .single();

  if (error || !data) {
    throw new Error('INVOICE_UNAVAILABLE');
  }

  return {
    payment: data.status,
    order: null
  };
}

function renderPDF(invoice, status) {

  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({
      size: 'A4',
      margin: 32,
      bufferPages: true,
      compress: true,
      info: {
        Title: invoice.invoice_number,
        Author: 'Srivari Milk Farms',
        Subject: invoice.is_receipt ? 'Payment Receipt' : 'Official Invoice'
      }
    });

    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const business = invoice.business_snapshot || {};
    const customer = invoice.customer_snapshot || {};
    const items = invoice.items_snapshot || [];
    const payment = status || {};

    const C = {
      green: '#03280D',
      gold: '#C69B3C',
      cream: '#FFFCF2',
      pale: '#F5F0E2',
      white: '#FFFFFF',
      ink: '#243127',
      muted: '#667066',
      border: '#D9C89D'
    };

    const W = doc.page.width;
    const H = doc.page.height;
    const L = 32;
    const R = W - 32;
    const CW = R - L;
    const bottom = H - 58;

    const bannerPath = path.join(
      __dirname, '../assets/invoice-banner.jpg'
    );

    const banner = doc.openImage(bannerPath);

    let y = 32;

    function text(value, x, top, width, options = {}) {
      const {
        size = 9,
        font = 'Helvetica',
        color = C.ink,
        align = 'left',
        lineGap = 1
      } = options;

      doc.font(font)
        .fontSize(size)
        .fillColor(color)
        .text(String(value ?? ''), x, top, {
          width,
          align,
          lineGap
        });

      return doc.y;
    }

    function measure(value, width, size = 9,
                     font = 'Helvetica') {
      doc.font(font).fontSize(size);

      return doc.heightOfString(
        String(value ?? ''),
        { width, lineGap: 1 }
      );
    }

    function rule(top) {
      doc.strokeColor(C.gold)
        .lineWidth(0.6)
        .moveTo(L, top)
        .lineTo(R, top)
        .stroke();
    }

    function decoratePage() {
      doc.rect(0, 0, W, H).fill(C.cream);

      doc.rect(15, 15, W - 30, H - 30)
        .lineWidth(1)
        .stroke(C.gold);

      doc.rect(19, 19, W - 38, H - 38)
        .lineWidth(0.3)
        .stroke(C.gold);
    }

    decoratePage();

    function nextPage() {
      doc.addPage();
      decoratePage();

      text(
        business.name || 'Srivari Milk Farms',
        L, 31, CW * 0.6,
        {
          font: 'Times-Bold',
          size: 17,
          color: C.green
        }
      );

      text(invoice.invoice_number, L, 35, CW, {
        size: 8,
        align: 'right',
        color: C.muted
      });

      rule(58);
      y = 70;
    }

    function ensureSpace(height) {
      if (height > bottom - 70) {
        throw new Error(
          'Invoice content block exceeds page capacity'
        );
      }

      if (y + height > bottom) {
        nextPage();
      }
    }

    function heading(label) {
      ensureSpace(28);

      text(label, L, y, CW, {
        font: 'Times-Bold',
        size: 12,
        color: C.green
      });

      y += 17;
      rule(y);
      y += 8;
    }

    // ======================================
    // PREMIUM BRAND HEADER
    // ======================================

    const bannerHeight = 105;

    doc.image(
      banner,
      L,
      y,
      {
        width: CW,
        height: bannerHeight
      }
    );

    y += bannerHeight + 5;

    y = text(
      business.address || '',
      L, y, CW,
      { size: 8.3, align: 'center' }
    ) + 3;

    const contact = [
      business.phone,
      business.email,
      business.website
    ].filter(Boolean).join('  |  ');

    y = text(contact, L, y, CW, {
      size: 8,
      align: 'center',
      color: C.muted
    }) + 9;

    rule(y);
    y += 10;

    // ======================================
    // INVOICE TITLE
    // ======================================

    text(invoice.is_receipt ? 'PAYMENT RECEIPT' : 'INVOICE', L, y, CW, {
      font: 'Times-Bold',
      size: 23,
      color: C.green
    });

    const typeLabels = {
      one_time: 'ONE-TIME ORDER',
      subscription_plan: 'PREPAID SUBSCRIPTION',
      subscription_delivery: 'SUBSCRIPTION DELIVERY',
      subscription_postpaid: 'POSTPAID SUBSCRIPTION'
    };

    text(
      typeLabels[invoice.invoice_type] || '',
      L + (invoice.is_receipt ? 280 : 160), y + 8,
      CW - (invoice.is_receipt ? 280 : 160),
      {
        font: 'Helvetica-Bold',
        size: 8.5,
        align: 'right',
        color: C.green
      }
    );

    y += 29;

    // ======================================
    // CUSTOMER AND INVOICE INFORMATION
    // ======================================

    const gap = 12;
    const half = (CW - gap) / 2;
    const inner = half - 20;

    const billLines = [
      customer.name || 'Customer',
      customer.address,
      customer.phone
        ? 'Phone: ' + customer.phone : '',
      customer.email
        ? 'Email: ' + customer.email : '',
      customer.delivery_slot
        ? 'Delivery: ' + customer.delivery_slot : ''
    ].filter(Boolean);

    const orderLines = [
      (invoice.is_receipt ? 'Receipt No: ' : 'Invoice No: ') + invoice.invoice_number,
      (invoice.is_receipt ? 'Paid on: ' : 'Issued: ') + dateLabel(invoice.issued_at),
      customer.order_number
        ? 'Order No: ' + customer.order_number : '',
      invoice.period_start
        ? 'Billing Period: ' +
          dateLabel(invoice.period_start) + ' to ' +
          dateLabel(invoice.period_end)
        : ''
    ].filter(Boolean);

    function blockHeight(lines) {
      return 25 + lines.reduce(
        (sum, line) => sum + measure(line, inner, 9) + 1,
        0
      );
    }

    const infoHeight = Math.max(
      88,
      blockHeight(billLines),
      blockHeight(orderLines)
    );

    ensureSpace(infoHeight + 15);

    function infoBox(title, lines, x) {

      doc.roundedRect(x, y, half, infoHeight, 5)
        .fillAndStroke(C.pale, C.border);

      let top = text(title, x + 10, y + 7, inner, {
        font: 'Helvetica-Bold',
        size: 9,
        color: C.green
      }) + 4;

      for (const line of lines) {
        top = text(line, x + 10, top, inner, {
          size: 9
        }) + 1;
      }
    }

    infoBox('BILL TO', billLines, L);
    infoBox(invoice.is_receipt ? 'RECEIPT DETAILS' : 'INVOICE DETAILS', orderLines, L + half + gap);

    y += infoHeight + 10;

    // ======================================
    // ITEMIZED PRODUCT TABLE
    // ======================================

    const columns = [
      { label: 'S.No.', width: 35, align: 'center' },
      { label: 'Product Description', width: CW - 283 },
      { label: 'Qty', width: 48, align: 'center' },
      { label: 'Unit Price', width: 97, align: 'right' },
      { label: 'Amount', width: 103, align: 'right' }
    ];

    function tableHeader() {

      ensureSpace(27);

      doc.rect(L, y, CW, 25).fill(C.green);

      let x = L;

      for (const col of columns) {
        text(col.label, x + 5, y + 8, col.width - 10, {
          size: 8.5,
          font: 'Helvetica-Bold',
          color: C.white,
          align: col.align || 'left'
        });

        x += col.width;
      }

      y += 25;
    }

    function productRow(item, index) {

      const name = String(item.product_name || 'Product');
      const unit = String(item.unit || '');
      const description = name + (unit ? ' (' + unit + ')' : '');

      const values = [
        String(index + 1),
        description,
        String(item.quantity),
        money(item.unit_price_paise),
        money(item.line_total_paise)
      ];

      const height = Math.max(
        24,
        ...values.map((value, i) =>
          measure(value, columns[i].width - 10, 9) + 10
        )
      );

      if (height > bottom - 100) {
        throw new Error('Invoice product row is too large');
      }

      if (y + height > bottom) {
        nextPage();
        tableHeader();
      }

      doc.rect(L, y, CW, height)
        .fill(index % 2 ? C.pale : C.white);

      let x = L;

      values.forEach((value, i) => {

        text(value, x + 5, y + 5, columns[i].width - 10, {
          size: 9,
          align: columns[i].align || 'left'
        });

        x += columns[i].width;
      });

      y += height;

      doc.strokeColor(C.border)
        .lineWidth(0.35)
        .moveTo(L, y)
        .lineTo(R, y)
        .stroke();
    }

    ensureSpace(65);
    tableHeader();

    items.forEach(productRow);

    y += 10;

    // ======================================
    // PAYMENT AND GRAND TOTAL
    // ======================================

    const totals = [
      ['Subtotal', invoice.subtotal_paise]
    ];

    if (Number(invoice.delivery_charge_paise)) {
      totals.push([
        'Delivery Charge', invoice.delivery_charge_paise
      ]);
    }

    if (Number(invoice.discount_paise)) {
      totals.push([
        'Discount / Credit', invoice.discount_paise
      ]);
    }

    const totalX = L + CW * 0.52;
    const totalW = R - totalX;

    const currentPayment = String(
      payment.payment || 'Unavailable'
    );

    const paymentLines = [
      'Method: ' + String(invoice.payment_method || ''),
      'Current status: ' + currentPayment
    ];

    if (
      invoice.payment_status_at_issue &&
      invoice.payment_status_at_issue !== currentPayment
    ) {
      paymentLines.push(
        'Status at issue: ' + invoice.payment_status_at_issue
      );
    }

    if (invoice.is_receipt && invoice.payment_reference) {
      paymentLines.push('Reference: ' + invoice.payment_reference);
    }

    if (payment.order) {
      paymentLines.push('Order status: ' + payment.order);
    }

    const totalHeight = totals.length * 18 + 35;

    const paymentHeight = 22 + paymentLines.reduce(
      (sum, line) => sum +
        measure(line, CW * 0.48 - 20, 9) + 3,
      0
    );

    const summaryHeight = Math.max(
      60, totalHeight, paymentHeight
    );

    ensureSpace(summaryHeight + 18);

    const startY = y;

    let py = text('PAYMENT DETAILS', L, y, CW * 0.48, {
      font: 'Helvetica-Bold',
      size: 9,
      color: C.green
    }) + 7;

    for (const entry of paymentLines) {

      py = text(entry, L, py, CW * 0.48 - 20, {
        size: 9
      }) + 3;
    }

    let ty = startY;

    for (const [label, amount] of totals) {

      text(label, totalX + 5, ty, totalW * 0.54, {
        size: 9
      });

      const formatted =
        label === 'Discount / Credit'
          ? '- ' + money(amount)
          : money(amount);

      text(
        formatted,
        totalX + totalW * 0.55,
        ty,
        totalW * 0.45 - 5,
        { size: 9, align: 'right' }
      );

      ty += 18;
    }

    doc.roundedRect(totalX, ty, totalW, 32, 4)
      .fillAndStroke(C.green, C.gold);

    text(invoice.is_receipt ? 'AMOUNT PAID' : 'GRAND TOTAL', totalX + 10, ty + 11,
      totalW * 0.48 - 10, {
        size: 9,
        font: 'Helvetica-Bold',
        color: '#F1D38A'
      }
    );

    text(money(invoice.total_paise),
      totalX + totalW * 0.48, ty + 8,
      totalW * 0.52 - 10, {
        size: 13,
        font: 'Helvetica-Bold',
        color: C.white,
        align: 'right'
      }
    );

    y = startY + summaryHeight + 6;

    // ======================================
    // TERMS AND CONDITIONS
    // ======================================

    heading('Terms & Conditions');

    for (const [index, term] of
      (invoice.terms_snapshot || []).entries()) {

      const content = `${index + 1}. ${term}`;
      const height = measure(content, CW, 8);

      if (y + height + 4 > bottom) {
        nextPage();
        heading('Terms & Conditions - continued');
      }

      y = text(content, L, y, CW, {
        size: 8,
        color: C.muted
      }) + 3;
    }

    y += 10;

    // ======================================
    // PREMIUM THANK-YOU SECTION
    // ======================================

    const thanks = String(
      invoice.thank_you_snapshot || ''
    ).replace(/\n[ \t]*\n+/g, '\n');
    const thankHeight = measure(
      thanks, CW - 36, 9, 'Times-Roman'
    ) + 20;

    ensureSpace(thankHeight);

    doc.roundedRect(L, y, CW, thankHeight, 6)
      .fillAndStroke(C.green, C.gold);

    text(thanks, L + 18, y + 10, CW - 36, {
      font: 'Times-Roman',
      size: 9,
      color: '#FFF5D8',
      align: 'center'
    });

    // ======================================
    // PAGE FOOTER
    // ======================================

    const range = doc.bufferedPageRange();

    for (
      let i = range.start;
      i < range.start + range.count;
      i++
    ) {

      doc.switchToPage(i);

      rule(H - 48);

      text(
        'Srivari Milk Farms | ' +
        (business.website || 'srivarimilkfarms.com'),
        L, H - 44, CW - 80,
        { size: 7, color: C.green }
      );

      text(
        `Page ${i - range.start + 1} of ${range.count}`,
        R - 80, H - 44, 80,
        { size: 7, align: 'right', color: C.green }
      );
    }

    doc.end();
  });
}

async function handleInvoiceRequest(event, headers) {

  try {

    const method =
      event.requestContext?.http?.method ||
      event.httpMethod;

    if (method !== 'POST') {
      return reply(headers, 405, {
        error: 'Method not allowed'
      });
    }

    if (
      event.isBase64Encoded ||
      typeof event.body !== 'string' ||
      Buffer.byteLength(event.body) > 16384
    ) {
      return reply(headers, 400, {
        error: 'Invalid request'
      });
    }

    let body;

    try {
      body = JSON.parse(event.body);
    } catch {
      return reply(headers, 400, {
        error: 'Invalid JSON'
      });
    }

    if (!body || typeof body !== 'object') {
      return reply(headers, 400, {
        error: 'Invalid request'
      });
    }

    const route = event.rawPath || event.path;

    const db = backendClient();

    const identity = await getIdentity(event);


    // Secure prepaid subscription receipt history and PDF.
    if (
      route === '/invoices/receipts/list' ||
      route === '/invoices/receipts/pdf'
    ) {
      if (!identity) {
        return reply(headers, 401, {
          error: 'Please sign in to access payment receipts.'
        });
      }

      if (route === '/invoices/receipts/list') {
        const page = body.page ?? 0;

        if (!Number.isInteger(page) || page < 0 || page > 10000) {
          return reply(headers, 400, {
            error: 'Invalid page'
          });
        }

        const receipts = await rpc(
          db,
          'list_subscription_payment_receipts',
          {
            p_customer_id: identity.admin ? null : identity.id,
            p_page: page,
            p_limit: 50
          }
        );

        if (!Array.isArray(receipts)) {
          throw new Error('RECEIPTS_UNAVAILABLE');
        }

        return reply(headers, 200, {
          success: true,
          receipts,
          page,
          has_more: receipts.length === 50
        });
      }

      if (
        typeof body.receipt_id !== 'string' ||
        !UUID.test(body.receipt_id)
      ) {
        return reply(headers, 400, {
          error: 'Invalid receipt ID'
        });
      }

      const receipt = await rpc(
        db,
        'get_subscription_payment_receipt',
        { p_payment_attempt_id: body.receipt_id }
      );

      if (!receipt || !canAccess(identity, receipt.customer_id)) {
        return reply(headers, 404, {
          error: 'Payment receipt unavailable'
        });
      }

      const gross = Number(receipt.gross_paise);
      const credit = Number(receipt.credit_applied_paise);
      const amount = Number(receipt.amount_paid_paise);

      if (
        ![gross, credit, amount].every(Number.isSafeInteger) ||
        gross < 1 || credit < 0 || amount < 1 ||
        gross - credit !== amount
      ) {
        throw new Error('INVALID_RECEIPT_TOTAL');
      }

      const document = {
        is_receipt: true,
        invoice_number: receipt.receipt_number,
        invoice_type: receipt.invoice_kind === 'plan'
          ? 'subscription_plan'
          : 'subscription_delivery',
        issued_at: receipt.paid_at,
        business_snapshot: receipt.business_snapshot,
        customer_snapshot: receipt.customer_snapshot,
        period_start: receipt.period_start,
        period_end: receipt.period_end,
        items_snapshot: [{
          product_name:
            receipt.product_name + ' - Prepaid subscription',
          unit: 'Payment',
          quantity: 1,
          unit_price_paise: gross,
          line_total_paise: gross
        }],
        subtotal_paise: gross,
        delivery_charge_paise: 0,
        discount_paise: credit,
        total_paise: amount,
        payment_method: 'Razorpay',
        payment_reference: receipt.payment_reference,
        payment_status_at_issue: 'Paid',
        terms_snapshot: [
          'This receipt acknowledges the original verified payment.',
          'This is a payment receipt, not a delivery or tax invoice.',
          'Delivery remains subject to subscription terms and approval.',
          'The final invoice is generated after the eligible delivery cycle is completed.',
          'Please retain this receipt for your records.'
        ],
        thank_you_snapshot:
          'Thank you for choosing Srivari Milk Farms.\\n\\n' +
          'Freshness You Can Trust, Quality You Deserve!\\n\\n' +
          'Team Srivari Milk Farms'
      };

      const pdf = await renderPDF(document, {
        payment: receipt.payment_status
      });

      return {
        statusCode: 200,
        isBase64Encoded: true,
        headers: {
          ...headers,
          'Content-Type': 'application/pdf',
          'Content-Disposition':
            (body.download === true ? 'attachment' : 'inline') +
            '; filename="' +
            receipt.receipt_number.replace(/[^A-Za-z0-9_-]/g, '') +
            '.pdf"',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff'
        },
        body: pdf.toString('base64')
      };
    }

    // Generate or retrieve a one-time order invoice.

    if (route === '/invoices/one-time') {

      const orderId = body.order_id;

      if (
        typeof orderId !== 'string' ||
        orderId.length > 100 ||
        !orderId.length
      ) {
        return reply(headers, 400, {
          error: 'Invalid order ID'
        });
      }

      const { data: order, error } = await db
        .from('one_time_orders')
        .select(
          'id,customer_id,idempotency_key,created_at'
        )
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw new Error('INVOICE_UNAVAILABLE');

      if (!order) {
        return reply(headers, 404, {
          error: 'Invoice unavailable'
        });
      }

      const guest = !identity && !order.customer_id;

      if (guest) {

        const age =
          Date.now() - new Date(order.created_at).getTime();

        if (
          !UUID.test(body.checkout_key || '') ||
          body.checkout_key !== order.idempotency_key ||
          !Number.isFinite(age) ||
          age < 0 ||
          age >= GUEST_WINDOW
        ) {
          return reply(headers, 403, {
            error: 'Guest invoice access expired or invalid'
          });
        }

      } else if (!canAccess(identity, order.customer_id)) {

        return reply(headers, 403, {
          error: 'Access denied'
        });
      }

      await rpc(db, 'issue_one_time_invoice', {
        p_order_id: orderId
      });

      const { data: invoice, error: invoiceError } =
        await db
          .from('invoice_documents')
          .select('id,invoice_number,issued_at')
          .eq('one_time_order_id', orderId)
          .single();

      if (invoiceError || !invoice) {
        throw new Error('INVOICE_UNAVAILABLE');
      }

      if (!guest) {
        return reply(headers, 200, {
          success: true,
          invoice
        });
      }

      const token = crypto.randomBytes(32).toString('hex');

      const access = await rpc(
        db,
        'create_guest_invoice_access',
        {
          p_order_id: orderId,
          p_checkout_key: body.checkout_key,
          p_token_hash: hashToken(token)
        }
      );

      const grant = Array.isArray(access)
        ? access[0]
        : access;

      if (!grant?.access_id) {
        throw new Error('INVOICE_UNAVAILABLE');
      }

      return reply(headers, 200, {
        success: true,
        invoice,
        guest_access: {
          access_id: grant.access_id,
          token,
          expires_at: new Date(
            Math.min(
              new Date(grant.expires_at).getTime(),
              new Date(order.created_at).getTime() +
                GUEST_WINDOW
            )
          ).toISOString()
        }
      });
    }

    // Permanent invoice history.


    // Historical orders belonging to the authenticated customer.
    if (route === '/invoices/orders') {
      if (!identity) {
        return reply(headers, 401, {
          error: 'Please sign in to access order history.'
        });
      }

      const page = body.page ?? 0;

      if (!Number.isInteger(page) || page < 0 || page > 10000) {
        return reply(headers, 400, {
          error: 'Invalid page'
        });
      }

      let query = db
        .from('one_time_orders')
        .select(
          'id,order_number,order_date,created_at,total_amount,' +
          'payment_method,payment_status,status'
        )
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(page * 50, page * 50 + 49);

      if (!identity.admin) {
        query = query.eq('customer_id', identity.id);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('ORDER_HISTORY_UNAVAILABLE');
      }

      return reply(headers, 200, {
        success: true,
        orders: data || [],
        page,
        has_more: (data || []).length === 50
      });
    }

    if (route === '/invoices/list') {

      if (!identity) {
        return reply(headers, 401, {
          error: 'Sign in required'
        });
      }

      const page = Number(body.page ?? 0);

      if (
        !Number.isInteger(page) ||
        page < 0 ||
        page > 10000
      ) {
        return reply(headers, 400, {
          error: 'Invalid page'
        });
      }

      let query = db
        .from('invoice_documents')
        .select(`
          id,
          invoice_number,
          invoice_type,
          one_time_order_id,
          subscription_invoice_id,
          issued_at,
          total_paise,
          currency,
          payment_status_at_issue,
          period_start,
          period_end
        `)
        .order('issued_at', { ascending: false })
        .order('id', { ascending: false })
        .range(page * 50, page * 50 + 49);

      if (!identity.admin) {
        query = query.eq('customer_id', identity.id);
      }

      const { data, error } = await query;

      if (error) throw new Error('INVOICE_UNAVAILABLE');

      return reply(headers, 200, {
        success: true,
        invoices: data || [],
        page,
        has_more: data?.length === 50
      });
    }

    // Secure PDF view and download.

    if (route === '/invoices/pdf') {

      if (!UUID.test(body.invoice_id || '')) {
        return reply(headers, 400, {
          error: 'Invalid invoice ID'
        });
      }

      const { data: invoice, error } = await db
        .from('invoice_documents')
        .select('*')
        .eq('id', body.invoice_id)
        .maybeSingle();

      if (error) throw new Error('INVOICE_UNAVAILABLE');

      if (!invoice) {
        return reply(headers, 404, {
          error: 'Invoice unavailable'
        });
      }

      let authorized =
        canAccess(identity, invoice.customer_id);

      if (
        !authorized &&
        !identity &&
        !invoice.customer_id &&
        invoice.one_time_order_id &&
        UUID.test(body.access_id || '') &&
        /^[a-f0-9]{64}$/.test(body.token || '')
      ) {

        const { data: access, error: accessError } =
          await db
            .from('invoice_guest_access')
            .select('invoice_id')
            .eq('id', body.access_id)
            .maybeSingle();

        if (accessError) {
          throw new Error('INVOICE_UNAVAILABLE');
        }

        const { data: order, error: orderError } =
          await db
            .from('one_time_orders')
            .select('created_at')
            .eq('id', invoice.one_time_order_id)
            .single();

        if (orderError) {
          throw new Error('INVOICE_UNAVAILABLE');
        }

        const age =
          Date.now() - new Date(order.created_at).getTime();

        if (
          access?.invoice_id === invoice.id &&
          Number.isFinite(age) &&
          age >= 0 &&
          age < GUEST_WINDOW
        ) {

          const valid = await rpc(
            db,
            'validate_guest_invoice_access',
            {
              p_access_id: body.access_id,
              p_token_hash: hashToken(body.token)
            }
          );

          authorized = valid === true;
        }
      }

      if (!authorized) {
        return reply(headers, 403, {
          error: 'Invoice access denied or expired'
        });
      }

      const status = await getCurrentStatus(db, invoice);

      const pdf = await renderPDF(invoice, status);

      const filename = String(invoice.invoice_number)
        .replace(/[^A-Za-z0-9_-]/g, '') + '.pdf';

      return {
        statusCode: 200,
        isBase64Encoded: true,
        headers: {
          ...headers,
          'Content-Type': 'application/pdf',
          'Content-Disposition':
            (body.download ? 'attachment' : 'inline') +
            '; filename="' + filename + '"',
          'Access-Control-Expose-Headers':
            'Content-Disposition',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff'
        },
        body: pdf.toString('base64')
      };
    }

    return reply(headers, 404, {
      error: 'Invoice route not found'
    });

  } catch (error) {

    console.error(
      'Invoice service error:',
      error.message
    );

    if (error.message === 'UNAUTHORIZED') {
      return reply(headers, 401, {
        error: 'Session expired or invalid'
      });
    }

    return reply(headers, 503, {
      error: 'Invoice temporarily unavailable'
    });
  }
}

async function processInvoiceSchedule(event) {

  if (process.env.ENABLE_INVOICE_SCHEDULER !== 'true') {
    return {
      skipped: true,
      reason: 'Invoice scheduler disabled'
    };
  }

  const type = event?.detail?.invoice_type;

  if (!['one_time', 'prepaid', 'postpaid'].includes(type)) {
    throw new Error('Invalid invoice batch type');
  }

  const db = backendClient();

  let cursor = event?.detail?.after_id || '';
  const startedAt = Date.now();
  const batches = [];

  // Limit database workload and Lambda execution time.
  for (let index = 0; index < 5; index++) {
    if (Date.now() - startedAt >= 10000) break;

    const result = await rpc(db, 'process_invoice_batch', {
      p_invoice_type: type,
      p_after_id: cursor,
      p_limit: 10
    });

    batches.push(result);

    if (!result?.has_more) {
      return {
        invoice_type: type,
        complete: true,
        batches
      };
    }

    if (!result.next_cursor || result.next_cursor === cursor) {
      throw new Error('INVOICE_CURSOR_NOT_ADVANCING');
    }

    cursor = result.next_cursor;
  }

  return {
    invoice_type: type,
    complete: false,
    next_cursor: cursor,
    batches
  };
}

module.exports = {
  handleInvoiceRequest,
  processInvoiceSchedule
};
