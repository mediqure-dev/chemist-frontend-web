import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, SearchBox, Select, Spinner, Table, Textarea, formatDate, formatMoney,
  useListQuery,
} from "../../../components/ui/index.jsx";

const ORDER_STATUSES = ["Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];
const TERMINAL_STATUSES = ["Delivered", "Cancelled"];
// Each in-flight status has exactly one forward step; Cancel is offered separately.
const NEXT_FORWARD_STATUS = {
  Confirmed: "Preparing",
  Preparing: "Ready",
  Ready: "Out for Delivery",
  "Out for Delivery": "Delivered",
};

function authGuard(err, navigate) {
  if (/token|authentication|expired/i.test(err.message)) {
    localStorage.clear();
    navigate("/login", { replace: true });
  }
}

function itemsSummary(items) {
  if (!items?.length) return "—";
  const names = items.map((i) => i.medicineName);
  const shown = names.slice(0, 2).join(", ");
  return names.length > 2 ? `${shown} +${names.length - 2} more` : shown;
}

export default function Orders() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  const list = useListQuery(
    ({ page, search }) =>
      apiRequest(`/api/chemist/orders${toQuery({ page, limit: 20, search, status })}`)
        .then((res) => ({ rows: res.data.data, totalPages: res.data.totalPages })),
    [status]
  );

  useEffect(() => {
    if (list.error) authGuard({ message: list.error }, navigate);
  }, [list.error, navigate]);

  const columns = [
    { key: "orderNumber", label: "Order #" },
    { key: "items", label: "Items", render: (o) => (
      <div>
        <div className="font-medium text-slate-800">{o.items?.length || 0} item{(o.items?.length || 0) === 1 ? "" : "s"}</div>
        <div className="text-xs text-slate-500">{itemsSummary(o.items)}</div>
      </div>
    ) },
    { key: "status", label: "Status", render: (o) => <Badge>{o.status}</Badge> },
    { key: "paymentStatus", label: "Payment", render: (o) => <Badge>{o.paymentStatus}</Badge> },
    { key: "grandTotal", label: "Total", render: (o) => formatMoney(o.grandTotal) },
    { key: "orderDate", label: "Date", render: (o) => formatDate(o.orderDate) },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders and fulfillment"
        action={<Button onClick={() => setCreating(true)}>New order</Button>}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search order # or medicine…" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <Card className="p-4">
        {list.loading ? <Spinner /> : list.error ? <Banner message={list.error} /> : (
          <>
            <Table columns={columns} rows={list.rows} onRowClick={(row) => setSelected(row)} emptyMessage="No orders found." />
            <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
          </>
        )}
      </Card>

      {creating && (
        <NewOrderModal
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); list.reload(); }}
        />
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onChanged={(updated) => { setSelected(updated); list.reload(); }}
        />
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose, onChanged }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  function confirmOrder() {
    runAction(`/api/chemist/orders/${order._id}/confirm`, { method: "PATCH" });
  }

  function cancelOrder() {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    runAction(`/api/chemist/orders/${order._id}/cancel`, { method: "PATCH" });
  }

  function advanceStatus(nextStatus) {
    runAction(`/api/chemist/orders/${order._id}/status`, { method: "PATCH", body: { status: nextStatus } });
  }

  const isTerminal = TERMINAL_STATUSES.includes(order.status);
  const nextStatus = NEXT_FORWARD_STATUS[order.status];

  return (
    <Modal open onClose={onClose} title={`Order ${order.orderNumber}`} width="max-w-2xl">
      {error && <Banner message={error} />}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge>{order.status}</Badge>
        <Badge>{order.paymentStatus}</Badge>
        <span className="text-xs text-slate-500">{formatDate(order.orderDate)}</span>
      </div>

      <h3 className="font-semibold text-sm text-slate-700 mb-2">Items</h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="text-left p-2 font-medium">Medicine</th>
              <th className="text-left p-2 font-medium">Batch</th>
              <th className="text-right p-2 font-medium">Qty</th>
              <th className="text-right p-2 font-medium">Price</th>
              <th className="text-right p-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((it, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                <td className="p-2">{it.medicineName}</td>
                <td className="p-2 text-slate-500">{it.batchNumber || "—"}</td>
                <td className="p-2 text-right">{it.quantity}</td>
                <td className="p-2 text-right">{formatMoney(it.sellingPrice)}</td>
                <td className="p-2 text-right">{formatMoney(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
        <Row label="Subtotal" value={formatMoney(order.subTotal)} />
        <Row label="Discount" value={formatMoney(order.discount)} />
        <Row label="Tax" value={formatMoney(order.tax)} />
        <Row label="Delivery fee" value={formatMoney(order.deliveryFee)} />
        <Row label="Grand total" value={formatMoney(order.grandTotal)} bold />
        <Row label="Payment method" value={order.paymentMethod || "—"} />
      </div>

      {(order.deliveryAddress || order.notes) && (
        <div className="mb-4 text-sm">
          {order.deliveryAddress && <p className="mb-1"><span className="text-slate-500">Delivery address: </span>{order.deliveryAddress}</p>}
          {order.notes && <p><span className="text-slate-500">Notes: </span>{order.notes}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
        {order.status === "Pending" && (
          <Button size="sm" loading={busy} onClick={confirmOrder}>Confirm</Button>
        )}
        {nextStatus && (
          <Button size="sm" variant="secondary" loading={busy} onClick={() => advanceStatus(nextStatus)}>Mark as {nextStatus}</Button>
        )}
        {!isTerminal && (
          <Button size="sm" variant="danger" loading={busy} onClick={cancelOrder}>Cancel order</Button>
        )}
      </div>
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

function NewOrderModal({ onClose, onCreated }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      apiRequest(`/api/chemist/inventory${toQuery({ search: q, limit: 10 })}`)
        .then((res) => { if (!cancelled) setResults(res.data.data || []); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  function addItem(inv) {
    setItems((prev) => {
      const existing = prev.find((it) => it.inventoryId === inv._id);
      if (existing) {
        return prev.map((it) => it.inventoryId === inv._id ? { ...it, quantity: it.quantity + 1 } : it);
      }
      return [...prev, {
        inventoryId: inv._id,
        masterMedicineId: inv.masterMedicineId,
        medicineName: inv.medicineName,
        batchNumber: inv.batchNumber,
        available: (inv.quantity || 0) - (inv.reservedQuantity || 0),
        mrp: inv.mrp,
        quantity: 1,
        sellingPrice: inv.mrp,
      }];
    });
    setQuery("");
    setResults([]);
  }

  function updateItem(inventoryId, patch) {
    setItems((prev) => prev.map((it) => it.inventoryId === inventoryId ? { ...it, ...patch } : it));
  }

  function removeItem(inventoryId) {
    setItems((prev) => prev.filter((it) => it.inventoryId !== inventoryId));
  }

  const subTotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.sellingPrice) || 0), 0);
  const grandTotal = subTotal - (Number(discount) || 0) + (Number(tax) || 0) + (Number(deliveryFee) || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!items.length) { setError("Add at least one item."); return; }
    setSaving(true); setError("");
    try {
      const body = {
        items: items.map((it) => ({
          masterMedicineId: it.masterMedicineId,
          inventoryId: it.inventoryId,
          quantity: Number(it.quantity),
          sellingPrice: Number(it.sellingPrice),
        })),
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        deliveryAddress: deliveryAddress || undefined,
        notes: notes || undefined,
      };
      await apiRequest("/api/chemist/orders", { method: "POST", body });
      onCreated();
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
      title="New order"
      width="max-w-2xl"
      footer={[
        <Button key="cancel" variant="secondary" onClick={onClose}>Cancel</Button>,
        <Button key="submit" form="new-order-form" type="submit" loading={saving}>Create order</Button>,
      ]}
    >
      {error && <Banner message={error} />}
      <form id="new-order-form" onSubmit={handleSubmit}>
        <Field label="Search medicine to add" hint="Search inventory by medicine name, batch or barcode">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Paracetamol" />
        </Field>

        {searching && <p className="text-xs text-slate-400 mb-2">Searching…</p>}
        {results.length > 0 && (
          <div className="border border-slate-200 rounded-lg mb-3 divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {results.map((inv) => (
              <button
                type="button"
                key={inv._id}
                onClick={() => addItem(inv)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
              >
                <span>
                  <span className="font-medium">{inv.medicineName}</span>
                  <span className="text-slate-400"> · batch {inv.batchNumber} · avail {(inv.quantity || 0) - (inv.reservedQuantity || 0)}</span>
                </span>
                <span className="text-slate-500">{formatMoney(inv.mrp)}</span>
              </button>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState message="No items added yet." />
        ) : (
          <div className="mb-4 space-y-2">
            {items.map((it) => (
              <div key={it.inventoryId} className="flex flex-wrap items-center gap-2 bg-slate-50 rounded-lg p-2">
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-medium">{it.medicineName}</p>
                  <p className="text-xs text-slate-500">Batch {it.batchNumber} · avail {it.available}</p>
                </div>
                <Input
                  type="number" min="1" step="1" value={it.quantity}
                  onChange={(e) => updateItem(it.inventoryId, { quantity: e.target.value })}
                  className="w-20"
                />
                <Input
                  type="number" min="0" step="any" value={it.sellingPrice}
                  onChange={(e) => updateItem(it.inventoryId, { sellingPrice: e.target.value })}
                  className="w-24"
                />
                <span className="text-sm w-20 text-right">{formatMoney((Number(it.quantity) || 0) * (Number(it.sellingPrice) || 0))}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(it.inventoryId)}>Remove</Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Discount"><Input type="number" min="0" step="any" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
          <Field label="Tax"><Input type="number" min="0" step="any" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
          <Field label="Delivery fee"><Input type="number" min="0" step="any" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} /></Field>
        </div>
        <Field label="Delivery address (optional)"><Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} /></Field>
        <Field label="Notes (optional)"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>

        <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
          <span className="text-slate-500">Running subtotal</span>
          <span className="font-semibold">{formatMoney(subTotal)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Estimated grand total</span>
          <span className="font-bold text-indigo-700">{formatMoney(grandTotal)}</span>
        </div>
      </form>
    </Modal>
  );
}
