import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { WHATSAPP_API_BASE_URL } from '../lib/apiConfig';

export default function AdminWhatsApp() {
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const lock = useRef(false);

  const eligibleRows = rows.filter(r => r.eligible);

  async function api(data) {
    const { data: { session } } =
      await supabase.auth.getSession();

    if (!session) throw Error('Login required');

    const response = await fetch(
      `${WHATSAPP_API_BASE_URL}/whatsapp/verification?admin_messaging=1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw Error(result.error || 'Request failed');
    }

    return result;
  }

  async function load() {
    const result = await api({ action: 'list' });

    const unique = [
      ...new Map(
        result.recipients.map(r => [r.phone, r])
      ).values()
    ];

    setRows(unique);
    setHistory(result.history);
    setSelected([]);
  }

  async function refresh() {
    if (lock.current) return;

    lock.current = true;
    setBusy(true);

    try {
      await load();
      setNotice('Customer directory loaded');
    } catch (e) {
      setNotice(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function send() {
    if (
      lock.current ||
      !selected.length ||
      !body.trim()
    ) return;

    const confirmed = window.confirm(
      `Send this message to ${selected.length} customers?\n\n${body}`
    );

    if (!confirmed) return;

    lock.current = true;
    setBusy(true);

    let accepted = 0;
    let other = 0;

    try {
      const recipients = rows.filter(
        r => r.eligible && selected.includes(r.phone)
      );

      for (const recipient of recipients) {
        try {
          const result = await api({
            action: 'send',
            id: crypto.randomUUID(),
            customer_id: recipient.customer_id,
            phone: recipient.phone,
            body
          });

          if (result.status === 'accepted') {
            accepted++;
          } else {
            other++;
          }
        } catch {
          other++;
        }

        setNotice(
          `Processing: ${accepted + other}/${recipients.length}`
        );
      }

      setBody('');
      await load();

      setNotice(
        `${accepted} accepted; ${other} failed or uncertain. ` +
        'Check history before retrying.'
      );

    } catch (e) {
      setNotice(
        `${accepted} accepted; ${other} other. ${e.message}`
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="bg-white rounded-3xl border shadow-md p-6 space-y-4">

      <h3 className="text-xl font-bold text-green-900">
        WhatsApp Messaging
      </h3>

      <p className="text-sm text-gray-600">
        All registered and guest customers are listed.
        Free custom messaging is available for opted-in
        customers with an active service window.
      </p>

      <div className="rounded-xl border border-green-200 bg-green-50 p-3">
        <strong className="text-green-800">
          Free Messages Only
        </strong>
        <p className="text-xs text-gray-600">
          Paid template messaging is disabled.
          No automatic paid fallback.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-xl p-3">
          <small>Total Customers</small>
          <div className="text-2xl font-bold">
            {rows.length}
          </div>
        </div>

        <div className="border rounded-xl p-3">
          <small>Free Messaging Eligible</small>
          <div className="text-2xl font-bold text-green-700">
            {eligibleRows.length}
          </div>
        </div>
      </div>

      <button
        disabled={busy}
        onClick={refresh}
        className="border rounded-xl p-3"
      >
        Load All Customers / History
      </button>

      <label className="block font-semibold">
        <input
          type="checkbox"
          className="mr-2"
          disabled={busy}
          checked={
            eligibleRows.length > 0 &&
            selected.length === eligibleRows.length
          }
          onChange={e =>
            setSelected(
              e.target.checked
                ? eligibleRows.map(r => r.phone)
                : []
            )
          }
        />
        Select All Eligible Customers ({eligibleRows.length})
      </label>

      <div className="max-h-64 overflow-auto border rounded-xl p-3">

        {rows.length === 0 && (
          <p className="text-gray-500">
            No customers loaded.
          </p>
        )}

        {rows.map(r => (
          <label
            key={r.phone}
            className="block border-b py-2"
          >
            <input
              type="checkbox"
              className="mr-2"
              disabled={busy || !r.eligible}
              checked={selected.includes(r.phone)}
              onChange={e =>
                setSelected(s =>
                  e.target.checked
                    ? [...s, r.phone]
                    : s.filter(p => p !== r.phone)
                )
              }
            />

            <span className="font-semibold">
              {r.name || 'Customer'} — {r.phone}
            </span>

            <div className="ml-6 text-xs text-gray-500">
              {r.customer_type}
            </div>

            <div className={`ml-6 text-xs font-semibold ${
              r.eligible ? 'text-green-700' : 'text-amber-700'
            }`}>
              {r.eligibility_reason}
            </div>
          </label>
        ))}

      </div>

      <textarea
        className="w-full border rounded-xl p-3"
        rows={6}
        maxLength={4096}
        disabled={busy}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Compose your WhatsApp message..."
      />

      <p className="text-sm text-gray-500">
        {body.length}/4096 characters |
        {' '}{selected.length} customers selected
      </p>

      <button
        className="bg-green-800 text-white rounded-xl p-3 disabled:opacity-50"
        disabled={
          busy ||
          !selected.length ||
          !body.trim()
        }
        onClick={send}
      >
        {busy
          ? 'Processing...'
          : `Send WhatsApp Message (${selected.length})`}
      </button>

      <p role="status" className="font-medium">
        {notice}
      </p>

      <h4 className="font-bold text-lg">
        Recent Message History
      </h4>

      {history.map(h => (
        <div key={h.id} className="border-b py-3">
          <b>{h.phone} — {h.status}</b>

          <p className="whitespace-pre-wrap">
            {h.body}
          </p>

          <small className="text-gray-500">
            {new Date(h.created_at).toLocaleString()}
          </small>
        </div>
      ))}

    </section>
  );
}
