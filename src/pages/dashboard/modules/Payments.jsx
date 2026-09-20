import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, Select, Spinner, Table, Textarea, formatDate, formatMoney,
  useListQuery,
} from "../../../components/ui/index.jsx";

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];
const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Online"];

function authGuard(err, navigate) {
  if (/token|authentication|expired/i.test(err.message)) {
    localStorage.clear();
    navigate("/login", { replace: true });
  }
}

export default function Payments() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [recording, setRecording] = useState(false);
  const [selected, setSelected] = useState(null);

  const list = useListQuery(
    ({ page }) =>
      apiRequest(`/api/chemist/payments${toQuery({ page, limit: 20, status })}`)
        .then((res) => ({ rows: res.data.data, totalPages: res.data.totalPages })),
    [status]
  );

  useEffect(() => {
    if (list.error) authGuard({ message: list.error }, navigate);
  }, [list.error, navigate]);

  const columns = [
    { key: "orderNumber", label: "Order #" },
    { key: "method", label: "Method", render: (p) => <Badge>{p.method}</Badge> },
    { key: "amount", label: "Amount", render: (p) => formatMoney(p.amount) },
    { key: "status", label: "Status", render: (p) => <Badge>{p.status}</Badge> },
    { key: "paidAt", label: "Paid at", render: (p) => formatDate(p.paidAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Track and settle order payments"
        action={<Button onClick={() => setRecording(true)}>Record payment</Button>}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs">
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <Card className="p-4">
        {list.loading ? <Spinner /> : list.error ? <Banner message={list.error} /> : (
          <>
            <Table columns={columns} rows={list.rows} onRowClick={(row) => setSelected(row)} emptyMessage="No payments found." />
            <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
          </>
        )}
      </Card>

      {recording && (
        <RecordPaymentModal
          onClose={() => setRecording(false)}
          onDone={() => { setRecording(false); list.reload(); }}
        />
      )}

      {selected && (
        <PaymentDetailModal
          payment={selected}
          onClose={() => setSelected(null)}
          onChanged={(updated) => { setSelected(updated); list.reload(); }}
        />
      )}
    </div>
  );
}

function PaymentDetailModal({ payment, onClose, onChanged }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");

  async function runAction(path, options) {
    setBusy(true); setError("");
    try {
      const res = await apiRequest(path, options);
      onChanged(res.data);
    } catch (err) {
      setError(err.message);
      authGuard(err, navigate);
    } finally {
      setBusy(false);
    }
  }

  function markPaid() {
    runAction(`/api/chemist/payments/${payment._id}/complete`, { method: "PATCH", body: { transactionId: transactionId || undefined } });
  }

  function markFailed() {
    runAction(`/api/chemist/payments/${payment._id}/failed`, { method: "PATCH", body: { notes: notes || undefined } });
  }

  function refund() {
    if (!window.confirm("Refund this payment? This cannot be undone.")) return;
    runAction(`/api/chemist/payments/${payment._id}/refund`, { method: "PATCH", body: { notes: notes || undefined } });
  }

  const isPending = payment.status === "Pending";
  const isPaid = payment.status === "Paid";

  return (
    <Modal open onClose={onClose} title={`Payment for ${payment.orderNumber}`} width="max-w-lg">
      {error && <Banner message={error} />}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge>{payment.status}</Badge>
        <Badge>{payment.method}</Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
        <Row label="Amount" value={formatMoney(payment.amount)} bold />
        <Row label="Currency" value={payment.currency || "INR"} />
        <Row label="Transaction ID" value={payment.transactionId || "—"} />
        <Row label="Gateway" value={payment.gateway || "—"} />
        <Row label="Paid at" value={formatDate(payment.paidAt)} />
        <Row label="Created" value={formatDate(payment.createdAt)} />
      </div>
      {payment.notes && <p className="text-sm mb-4"><span className="text-slate-500">Notes: </span>{payment.notes}</p>}

      {isPending && (
        <div className="border-t border-slate-200 pt-3 space-y-3">
          <Field label="Transaction ID (optional)"><Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} /></Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={busy} onClick={markPaid}>Mark as paid</Button>
            <Button size="sm" variant="danger" loading={busy} onClick={markFailed}>Mark as failed</Button>
          </div>
          <Field label="Notes for failure (optional)"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
      )}

      {isPaid && (
        <div className="border-t border-slate-200 pt-3 space-y-3">
          <Field label="Refund notes (optional)"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <Button size="sm" variant="danger" loading={busy} onClick={refund}>Refund</Button>
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value, bold }) {
  return (
    <p className="flex justify-between py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </p>
  );
}

function RecordPaymentModal({ onClose, onDone }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [method, setMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest(`/api/chemist/orders${toQuery({ status: "Confirmed", limit: 50 })}`)
      .then((res) => setOrders((res.data.data || []).filter((o) => o.paymentStatus === "Pending")))
      .catch((err) => { setError(err.message); authGuard(err, navigate); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!orderId) { setError("Pick an order."); return; }
    setSaving(true); setError("");
    try {
      if (method === "Cash") {
        await apiRequest("/api/chemist/payments/cash", { method: "POST", body: { orderId } });
      } else {
        await apiRequest("/api/chemist/payments", { method: "POST", body: { orderId, method } });
      }
      onDone();
    } catch (err) {
      setError(err.message);
      authGuard(err, navigate);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Record payment"
      footer={[
        <Button key="cancel" variant="secondary" onClick={onClose}>Cancel</Button>,
        <Button key="submit" form="record-payment-form" type="submit" loading={saving}>Record</Button>,
      ]}
    >
      {error && <Banner message={error} />}
      {loading ? <Spinner /> : (
        <form id="record-payment-form" onSubmit={submit}>
          {orders.length === 0 ? (
            <EmptyState message="No confirmed orders awaiting payment." />
          ) : (
            <Field label="Order" hint="Confirmed orders without a payment yet">
              <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                <option value="">Select an order…</option>
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>{o.orderNumber} · {formatMoney(o.grandTotal)}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
          <p className="text-xs text-slate-400">
            {method === "Cash" ? "Cash payments are marked as paid immediately." : "This will create a pending payment you can complete later."}
          </p>
        </form>
      )}
    </Modal>
  );
}
