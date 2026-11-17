import { API_BASE_URL } from './apiConfig';
import { supabase } from './supabase';

async function request(route, payload, guest = false) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (!guest) {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session?.access_token) {
      throw new Error('Please sign in again to access invoices.');
    }

    headers.Authorization =
      `Bearer ${data.session.access_token}`;
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/invoices/${route}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    const result = await response.json().catch(() => null);

    throw new Error(
      result?.error || 'Invoice temporarily unavailable.'
    );
  }

  return response;
}

export async function getOrderInvoice(
  orderId,
  checkoutKey = null,
  guest = false
) {
  const response = await request(
    'one-time',
    {
      order_id: String(orderId),
      ...(guest ? { checkout_key: checkoutKey } : {})
    },
    guest
  );

  const result = await response.json();

  if (!result.success || !result.invoice?.id) {
    throw new Error('Invoice unavailable.');
  }

  return result;
}

export async function listInvoices(page = 0) {
  const response = await request('list', { page });
  const result = await response.json();

  if (!result.success || !Array.isArray(result.invoices)) {
    throw new Error('Unable to load invoices.');
  }

  return result;
}

export async function getInvoicePDF(
  invoiceId,
  access = null,
  download = false
) {
  const response = await request(
    'pdf',
    {
      invoice_id: invoiceId,
      download,
      ...(access
        ? {
            access_id: access.access_id,
            token: access.token
          }
        : {})
    },
    Boolean(access)
  );

  if (!response.headers.get('Content-Type')
      ?.includes('application/pdf')) {
    throw new Error('Invalid invoice PDF response.');
  }

  return response.blob();
}


export async function listPaymentReceipts(page = 0) {
  const response = await request('receipts/list', { page });
  const result = await response.json();

  if (!result.success || !Array.isArray(result.receipts)) {
    throw new Error('Unable to load payment receipts.');
  }

  return result;
}

export async function getPaymentReceiptPDF(
  receiptId,
  download = false
) {
  const response = await request('receipts/pdf', {
    receipt_id: receiptId,
    download
  });

  if (!response.headers.get('Content-Type')
      ?.includes('application/pdf')) {
    throw new Error('Invalid receipt PDF response.');
  }

  return response.blob();
}


export async function listHistoricalOrders(page = 0) {
  const response = await request('orders', { page });
  const result = await response.json();

  if (!result.success || !Array.isArray(result.orders)) {
    throw new Error('Unable to load order history.');
  }

  return result;
}
