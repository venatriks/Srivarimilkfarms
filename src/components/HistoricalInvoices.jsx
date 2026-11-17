import React, { useState } from 'react';
import {
  listHistoricalOrders,
  getOrderInvoice,
  getInvoicePDF
} from '../lib/invoiceApi';

export function HistoricalInvoices() {
  const [orders, setOrders] = useState([]);
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
      const result = await listHistoricalOrders(nextPage);
      setOrders(result.orders);
      setPage(nextPage);
      setHasMore(result.has_more);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function openInvoice(order, download = false) {
    if (busy) return;

    const tab = download ? null : window.open('', '_blank');

    if (!download && !tab) {
      setError('Please allow pop-ups to view your invoice.');
      return;
    }

    if (tab) tab.opener = null;

    setBusy(true);
    setError('');

    try {
      const result = await getOrderInvoice(order.id);

      const blob = await getInvoicePDF(
        result.invoice.id,
        null,
        download
      );

      const url = URL.createObjectURL(blob);

      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = result.invoice.invoice_number + '.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        tab.location.href = url;
      }

      setTimeout(() => URL.revokeObjectURL(url), 300000);
    } catch (err) {
      if (tab) tab.close();
      setError(err.message || 'Invoice unavailable.');
    } finally {
      setBusy(false);
    }
  }

  const buttonClass =
    'px-3 py-2 rounded-lg border border-emerald-800 ' +
    'text-emerald-800 text-xs font-semibold disabled:opacity-50';

  return (
    <section className="bg-white rounded-2xl border p-5 my-5">
      <h3 className="text-lg font-bold text-emerald-950">
        Previous Order Invoices
      </h3>

      <p className="text-sm text-stone-500 my-2">
        View or download invoices for your previous eligible orders.
      </p>

      <button
        className={buttonClass}
        disabled={busy}
        onClick={() => load(0)}
      >
        {busy ? 'Please wait...' :
          loaded ? 'Refresh Orders' : 'Load Previous Orders'}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-700 mt-3">
          {error}
        </p>
      )}

      {loaded && orders.length === 0 && (
        <p className="text-sm text-stone-500 mt-3">
          No previous orders available.
        </p>
      )}

      {orders.map(order => (
        <article key={order.id}
          className="border rounded-xl p-3 mt-3">
          <p className="font-semibold break-all">
            {order.order_number || order.id}
          </p>

          <p className="text-sm text-stone-600">
            {order.order_date || order.created_at}
          </p>

          <p className="text-sm">
            ₹{Number(order.total_amount).toFixed(2)}
            {' | '}{order.status}
            {' | '}{order.payment_status}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <button className={buttonClass}
              disabled={busy}
              onClick={() => openInvoice(order)}>
              View / Print Invoice
            </button>

            <button className={buttonClass}
              disabled={busy}
              onClick={() => openInvoice(order, true)}>
              Download Invoice
            </button>
          </div>
        </article>
      ))}

      {loaded && (
        <div className="flex gap-3 items-center mt-4">
          <button className={buttonClass}
            disabled={busy || page === 0}
            onClick={() => load(page - 1)}>
            Previous
          </button>

          <span className="text-sm">Page {page + 1}</span>

          <button className={buttonClass}
            disabled={busy || !hasMore}
            onClick={() => load(page + 1)}>
            Next
          </button>
        </div>
      )}
    </section>
  );
}
