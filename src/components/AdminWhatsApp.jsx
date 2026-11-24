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
      setNotice('Eligible customers loaded');
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
        r => selected.includes(r.phone)
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
        Send custom messages to verified, opted-in customers
        with an active WhatsApp service window.
      </p>

      <button
        disabled={busy}
        onClick={refresh}
        className="border rounded-xl p-3"
      >
        Load Eligible Customers / History
      </button>

      <label className="block font-semibold">
        <input
          type="checkbox"
          className="mr-2"
          disabled={busy}
          checked={
            rows.length > 0 &&
            selected.length === rows.length
          }
          onChange={e =>
            setSelected(
              e.target.checked
                ? rows.map(r => r.phone)
                : []
            )
          }
        />
        Select All Eligible Customers ({rows.length})
      </label>

      <div className="max-h-64 overflow-auto border rounded-xl p-3">

        {rows.length === 0 && (
          <p className="text-gray-500">
            No eligible customers loaded.
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
              disabled={busy}
              checked={selected.includes(r.phone)}
              onChange={e =>
                setSelected(s =>
                  e.target.checked
                    ? [...s, r.phone]
                    : s.filter(p => p !== r.phone)
                )
              }
            />

            {r.name} — {r.phone}
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
