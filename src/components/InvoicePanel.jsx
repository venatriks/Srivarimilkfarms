import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  getOrderInvoice,
  listInvoices,
  getInvoicePDF,
  listPaymentReceipts,
  getPaymentReceiptPDF
} from '../lib/invoiceApi';

const buttonStyle =
  'px-4 py-2 rounded-xl text-xs font-bold ' +
  'bg-[#0F3E2E] text-white hover:bg-[#18523f] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const secondaryStyle =
  'px-4 py-2 rounded-xl text-xs font-bold ' +
  'border border-stone-200 bg-white text-[#0F3E2E] ' +
  'disabled:opacity-50';

const formatMoney = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(Number(value || 0) / 100);

const formatDate = value =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata'
      })
    : '';

const invoiceTypes = {
  one_time: 'One-Time Order',
  subscription_plan: 'Prepaid Subscription',
  subscription_delivery: 'Recurring Subscription',
  subscription_postpaid: 'Postpaid Subscription'
};

export function InvoiceActions({
  invoice,
  access = null,
  disabled = false,
  receipt = false
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function openPDF(download) {
    if (busy || disabled || !invoice?.id) return;

    let preview = null;

    if (!download) {
      preview = window.open('', '_blank');

      if (!preview) {
        setError('Please allow pop-ups to view the invoice.');
        return;
      }

      preview.opener = null;
      preview.document.title = 'Loading invoice';
      preview.document.body.textContent =
        'Preparing your invoice...';
    }

    setBusy(download ? 'download' : 'view');
    setError('');

    try {
      const blob = receipt
        ? await getPaymentReceiptPDF(invoice.id, download)
        : await getInvoicePDF(invoice.id, access, download);

      const url = URL.createObjectURL(blob);

      if (download) {
        const link = document.createElement('a');

        link.href = url;
        link.download =
          String(invoice.invoice_number || 'Invoice')
            .replace(/[^A-Za-z0-9_-]/g, '') + '.pdf';

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        preview.location.replace(url);

        setTimeout(
          () => URL.revokeObjectURL(url),
          30 * 60 * 1000
        );
      }
    } catch (err) {
      if (preview && !preview.closed) preview.close();

      setError(err.message || 'Unable to open invoice.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || Boolean(busy)}
          onClick={() => openPDF(false)}
          className={secondaryStyle}
        >
          {busy === 'view' ? 'Opening...' : 'View / Print'}
        </button>

        <button
          type="button"
          disabled={disabled || Boolean(busy)}
          onClick={() => openPDF(true)}
          className={buttonStyle}
        >
          {busy === 'download'
            ? 'Downloading...'
            : receipt ? 'Download Receipt' : 'Download Invoice'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}

export function OrderInvoicePanel({
  orderId,
  checkoutKey = null,
  guest = false,
  automatic = false
}) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(null);

  const inFlight = useRef(null);

  async function generate() {
    if (inFlight.current) return inFlight.current;

    setBusy(true);
    setError('');

    const task = getOrderInvoice(
      orderId,
      checkoutKey,
      guest
    )
      .then(setResult)
      .catch(err => {
        setError(err.message || 'Invoice unavailable.');
      })
      .finally(() => {
        inFlight.current = null;
        setBusy(false);
      });

    inFlight.current = task;

    return task;
  }

  useEffect(() => {
    if (automatic && orderId) generate();
  }, [orderId, automatic]);

  useEffect(() => {
    const expiry = result?.guest_access?.expires_at;

    if (!expiry) return;

    const update = () => {
      setRemaining(Math.max(
        0,
        Math.floor(
          (new Date(expiry).getTime() - Date.now()) / 1000
        )
      ));
    };

    update();

    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [result]);

  const expired = guest && remaining === 0;

  return (
    <div className="rounded-2xl border border-emerald-200
                    bg-emerald-50/50 p-4 space-y-3">
      <h4 className="font-bold text-sm text-[#0F3E2E]">
        Order Invoice
      </h4>

      {guest && (
        <div className="bg-amber-50 border border-amber-200
                        rounded-xl p-3 text-xs text-amber-900">
          As you have placed your order as a guest,
          please download and save your invoice before
          leaving this page.

          {remaining !== null && (
            <p className="font-bold mt-2">
              {expired
                ? 'Invoice access expired'
                : `Access expires in ${
                    Math.floor(remaining / 60)
                  }:${String(remaining % 60).padStart(2, '0')}`}
            </p>
          )}
        </div>
      )}

      {busy && (
        <p className="text-xs text-stone-600">
          Preparing your invoice...
        </p>
      )}

      {error && (
        <p className="text-xs text-red-700">
          {error}. This does not affect your confirmed order.
        </p>
      )}

      {!result && !busy && (
        <button
          type="button"
          onClick={generate}
          className={buttonStyle}
        >
          {error ? 'Retry Invoice' : 'Generate Invoice'}
        </button>
      )}

      {result?.invoice && (
        <>
          <p className="text-xs font-mono font-bold
                        text-[#0F3E2E]">
            {result.invoice.invoice_number}
          </p>

          <InvoiceActions
            invoice={result.invoice}
            access={result.guest_access || null}
            disabled={expired}
          />
        </>
      )}
    </div>
  );
}

export function OrderConfirmation({
  confirmation,
  onClose
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center
                    justify-center p-4 bg-black/70
                    backdrop-blur-sm overflow-y-auto">

      <div className="bg-[#FDFBF7] rounded-3xl max-w-lg
                      w-full shadow-2xl border
                      border-[#D4AF37]/40 overflow-hidden
                      max-h-[94vh] overflow-y-auto">

        <div className="bg-[#0F3E2E] text-white
                        p-6 text-center">
          <div className="text-4xl text-[#D4AF37]">
            ✓
          </div>

          <h2 className="font-serif-display text-2xl
                         font-bold mt-2">
            Order Confirmed!
          </h2>

          <p className="text-sm text-emerald-100 mt-2">
            Thank you for choosing Srivari Milk Farms.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-white rounded-xl p-4
                          border border-stone-200
                          text-sm space-y-2">

            <p className="font-bold text-[#0F3E2E]">
              Order: {confirmation.orderNumber ||
                confirmation.orderId}
            </p>

            <p className="font-medium text-stone-700">
              Payment status: {confirmation.paymentStatus}
            </p>
          </div>

          <OrderInvoicePanel
            orderId={confirmation.orderId}
            checkoutKey={confirmation.checkoutKey}
            guest={confirmation.guest}
            automatic={true}
          />

          <p className="text-center text-xs text-stone-500">
            Freshness You Can Trust, Quality You Deserve!
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold
                       text-sm bg-[#0F3E2E] text-white"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export function InvoiceHistory({ admin = false }) {
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load(nextPage = 0) {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const result = await listInvoices(nextPage);

      setInvoices(result.invoices);
      setPage(result.page);
      setHasMore(result.has_more);
      setLoaded(true);
    } catch (err) {
      setError(err.message || 'Unable to load invoices.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-6
                        border border-[#0F3E2E]/10
                        shadow-md space-y-4">

      <div className="flex flex-wrap items-center
                      justify-between gap-3">
        <div>
          <h3 className="font-serif-display text-xl
                         font-bold text-[#0F3E2E]">
            {admin ? 'Customer Invoices' : 'My Invoices'}
          </h3>

          <p className="text-xs text-stone-500 mt-1">
            One-time orders and completed subscription bills
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => load(0)}
          className={buttonStyle}
        >
          {busy
            ? 'Loading...'
            : loaded ? 'Refresh Invoices' : 'Load Invoices'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-700">{error}</p>
      )}

      {loaded && invoices.length === 0 && (
        <p className="text-sm text-stone-500 py-4">
          No invoices available on this page.
        </p>
      )}

      {invoices.map(invoice => (
        <div
          key={invoice.id}
          className="border border-stone-200 rounded-xl
                     p-4 space-y-3"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs font-mono font-bold
                            text-[#0F3E2E]">
                {invoice.invoice_number}
              </p>

              <p className="text-xs text-stone-600">
                {invoiceTypes[invoice.invoice_type] ||
                  'Invoice'}
              </p>

              <p className="text-xs text-stone-500">
                Issued: {formatDate(invoice.issued_at)}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-[#0F3E2E]">
                {formatMoney(invoice.total_paise)}
              </p>

              <p className="text-xs text-stone-500">
                At issue: {invoice.payment_status_at_issue}
              </p>
            </div>
          </div>

          {invoice.one_time_order_id && (
            <p className="text-xs text-stone-500 break-all">
              Order: {invoice.one_time_order_id}
            </p>
          )}

          {invoice.period_start && (
            <p className="text-xs text-stone-500">
              Billing period: {
                formatDate(invoice.period_start)
              } — {formatDate(invoice.period_end)}
            </p>
          )}

          <InvoiceActions invoice={invoice} />
        </div>
      ))}

      {loaded && (page > 0 || hasMore) && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={busy || page === 0}
            onClick={() => load(page - 1)}
            className={secondaryStyle}
          >
            Previous
          </button>

          <span className="text-xs text-stone-500">
            Page {page + 1}
          </span>

          <button
            type="button"
            disabled={busy || !hasMore}
            onClick={() => load(page + 1)}
            className={secondaryStyle}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}


export function PaymentReceiptHistory({ admin = false }) {
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load(nextPage = 0) {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const result = await listPaymentReceipts(nextPage);

      result.invoices = result.receipts.map(r => ({
        id: r.receipt_id,
        invoice_number: r.receipt_number,
        invoice_type: r.invoice_kind === 'plan'
          ? 'subscription_plan'
          : 'subscription_delivery',
        issued_at: r.paid_at,
        total_paise: r.amount_paid_paise,
        payment_status_at_issue: r.payment_status,
        period_start: r.period_start,
        period_end: r.period_end,
        customer_name: r.customer_name,
        product_name: r.product_name,
        payment_reference: r.payment_reference
      }));

      setInvoices(result.invoices);
      setPage(result.page);
      setHasMore(result.has_more);
      setLoaded(true);
    } catch (err) {
      setError(err.message || 'Unable to load payment receipts.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-6
                        border border-[#0F3E2E]/10
                        shadow-md space-y-4">

      <div className="flex flex-wrap items-center
                      justify-between gap-3">
        <div>
          <h3 className="font-serif-display text-xl
                         font-bold text-[#0F3E2E]">
            {admin ? 'Customer Payment Receipts' : 'My Payment Receipts'}
          </h3>

          <p className="text-xs text-stone-500 mt-1">
            Verified prepaid subscription payments
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => load(0)}
          className={buttonStyle}
        >
          {busy
            ? 'Loading...'
            : loaded ? 'Refresh Receipts' : 'Load Receipts'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-700">{error}</p>
      )}

      {loaded && invoices.length === 0 && (
        <p className="text-sm text-stone-500 py-4">
          No payment receipts available on this page.
        </p>
      )}

      {invoices.map(invoice => (
        <div
          key={invoice.id}
          className="border border-stone-200 rounded-xl
                     p-4 space-y-3"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs font-mono font-bold
                            text-[#0F3E2E]">
                {invoice.invoice_number}
              </p>

              <p className="text-xs text-stone-600">
                {invoiceTypes[invoice.invoice_type] ||
                  'Invoice'}
              </p>

              <p className="text-xs text-stone-500">
                Paid on: {formatDate(invoice.issued_at)}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-[#0F3E2E]">
                {formatMoney(invoice.total_paise)}
              </p>

              <p className="text-xs text-stone-500">
                Payment: {invoice.payment_status_at_issue}
              </p>
            </div>
          </div>

          {invoice.one_time_order_id && (
            <p className="text-xs text-stone-500 break-all">
              Order: {invoice.one_time_order_id}
            </p>
          )}

          {invoice.period_start && (
            <p className="text-xs text-stone-500">
              Billing period: {
                formatDate(invoice.period_start)
              } — {formatDate(invoice.period_end)}
            </p>
          )}

          {admin && invoice.customer_name && (
            <p className="text-xs text-stone-600">
              Customer: {invoice.customer_name}
            </p>
          )}

          <p className="text-xs text-stone-600 break-all">
            {invoice.product_name}
            {' | Ref: '}{invoice.payment_reference}
          </p>

          <InvoiceActions invoice={invoice} receipt={true} />
        </div>
      ))}

      {loaded && (page > 0 || hasMore) && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={busy || page === 0}
            onClick={() => load(page - 1)}
            className={secondaryStyle}
          >
            Previous
          </button>

          <span className="text-xs text-stone-500">
            Page {page + 1}
          </span>

          <button
            type="button"
            disabled={busy || !hasMore}
            onClick={() => load(page + 1)}
            className={secondaryStyle}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
