import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, Select, Spinner, Table, Textarea, formatDate, formatMoney,
  useListQuery,
} from "../../../components/ui/index.jsx";

const STATUS_OPTIONS = ["Pending", "Sent", "Accepted", "Rejected", "Converted", "Expired", "Cancelled"];
const AUTH_ERR = /token|authentication|expired/i;

function authGuard(err, navigate) {
  if (AUTH_ERR.test(err.message)) {
    localStorage.clear();
    navigate("/login", { replace: true });
    return true;
  }
  return false;
}

const columns = [
  { key: "quotationNumber", label: "Quotation #" },
  { key: "status", label: "Status", render: (row) => <Badge>{row.status}</Badge> },
  { key: "grandTotal", label: "Grand total", render: (row) => formatMoney(row.grandTotal) },
  { key: "validUntil", label: "Valid until", render: (row) => formatDate(row.validUntil) },
  { key: "orderId", label: "Linked order", render: (row) => row.orderId ? <span className="font-mono text-xs">{row.orderId}</span> : "—" },
];

export default function Quotations() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [banner, setBanner] = useState(null);

  const list = useListQuery(async ({ page }) => {
    const res = await apiRequest(`/api/chemist/quotations${toQuery({ status, page, limit: 20 })}`);
    return { rows: res.data.data, totalPages: res.data.totalPages };
  }, [status]);

  useEffect(() => {
    if (list.error) authGuard(new Error(list.error), navigate);
  }, [list.error, navigate]);

  function openDetail(row) {
    setSelected(row);
  }

  function handleCreated() {
    setCreateOpen(false);
    list.reload();
    setBanner({ type: "success", message: "Quotation created." });
  }

  function handleConverted(order) {
    setSelected(null);
    list.reload();
    setBanner({ type: "success", message: `Converted — order ${order.orderNumber || order._id} created.` });
  }

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Turn approved prescriptions into priced quotations and orders"
        action={<Button onClick={() => setCreateOpen(true)}>New quotation</Button>}
      />

      {banner && <Banner type={banner.type} message={banner.message} />}

      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {list.error && !AUTH_ERR.test(list.error) && <Banner message={list.error} />}

      {list.loading ? (
        <Spinner />
      ) : (
        <>
          <Table columns={columns} rows={list.rows} onRowClick={openDetail} emptyMessage="No quotations yet. Create one from an approved prescription." />
          <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
        </>
      )}

      {createOpen && (
        <NewQuotationModal onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      )}

      {selected && (
        <QuotationDetailModal
          quotation={selected}
          onClose={() => setSelected(null)}
          onChanged={(q) => { setSelected(q); list.reload(); }}
          onConverted={handleConverted}
        />
      )}
    </div>
  );
}

function QuotationDetailModal({ quotation, onClose, onChanged, onConverted }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function runPatch(path) {
    setBusy(true); setError("");
    try {
      const res = await apiRequest(`/api/chemist/quotations/${quotation._id}${path}`, { method: "PATCH" });
      onChanged(res.data);
    } catch (err) {
      setError(err.message);
      authGuard(err, navigate);
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!window.confirm("Reject this quotation?")) return;
    await runPatch("/reject");
  }

  async function cancel() {
    if (!window.confirm("Cancel this quotation? This cannot be undone.")) return;
    await runPatch("/cancel");
  }

  async function convert() {
    setBusy(true); setError("");
    try {
      const res = await apiRequest(`/api/chemist/quotations/${quotation._id}/convert`, { method: "POST" });
      onConverted(res.data);
    } catch (err) {
      setError(err.message);
      authGuard(err, navigate);
    } finally {
      setBusy(false);
    }
  }

  const canCancel = !["Converted", "Cancelled", "Rejected", "Expired"].includes(quotation.status);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Quotation ${quotation.quotationNumber}`}
      width="max-w-2xl"
      footer={
        <>
          {quotation.status === "Pending" && <Button loading={busy} onClick={() => runPatch("/send")}>Send</Button>}
          {quotation.status === "Sent" && (
            <>
              <Button variant="danger" disabled={busy} onClick={reject}>Reject</Button>
              <Button loading={busy} onClick={() => runPatch("/accept")}>Accept</Button>
            </>
          )}
          {quotation.status === "Accepted" && !quotation.orderId && (
            <Button loading={busy} onClick={convert}>Convert to order</Button>
          )}
          {canCancel && <Button variant="secondary" disabled={busy} onClick={cancel}>Cancel</Button>}
        </>
      }
    >
      {error && <Banner message={error} />}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-slate-500">Status:</span>
        <Badge>{quotation.status}</Badge>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 mb-2">Line items</p>
        <div className="space-y-2">
          {(quotation.items || []).map((it, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-50 rounded-lg p-2 text-sm">
              <div>
                <p className="font-medium">{it.medicineName}</p>
                <p className="text-xs text-slate-500">Batch {it.batchNumber} · qty {it.quantity} · {formatMoney(it.sellingPrice)} each</p>
              </div>
              <span className="font-semibold">{formatMoney(it.total)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1 text-sm border-t border-slate-200 pt-3">
        <Row label="Subtotal" value={formatMoney(quotation.subTotal)} />
        <Row label="Discount" value={formatMoney(quotation.discount)} />
        <Row label="Tax" value={formatMoney(quotation.tax)} />
        <Row label="Delivery fee" value={formatMoney(quotation.deliveryFee)} />
        <Row label="Grand total" value={formatMoney(quotation.grandTotal)} bold />
        <Row label="Valid until" value={formatDate(quotation.validUntil)} />
      </div>

      {quotation.notes && (
        <p className="text-sm mt-3"><span className="text-slate-500">Notes: </span>{quotation.notes}</p>
      )}

      {quotation.orderId && (
        <div className="mt-4 p-3 rounded-lg bg-slate-50 text-sm text-slate-600">
          Linked order ID: <span className="font-mono text-xs">{quotation.orderId}</span>
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

function NewQuotationModal({ onClose, onCreated }) {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [prescriptionId, setPrescriptionId] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest(`/api/chemist/prescriptions${toQuery({ status: "Approved", limit: 50 })}`)
      .then((res) => setPrescriptions(res.data.data || []))
      .catch((err) => { setError(err.message); authGuard(err, navigate); })
      .finally(() => setLoadingPrescriptions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (prev.find((it) => it.inventoryId === inv._id)) return prev;
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
    if (!prescriptionId) { setError("Choose an approved prescription."); return; }
    if (!items.length) { setError("Add at least one item."); return; }
    setSaving(true); setError("");
    try {
      const body = {
        prescriptionId,
        items: items.map((it) => ({
          masterMedicineId: it.masterMedicineId,
          inventoryId: it.inventoryId,
          quantity: Number(it.quantity),
          sellingPrice: Number(it.sellingPrice),
        })),
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        notes: notes || undefined,
        validUntil: validUntil || undefined,
      };
      await apiRequest("/api/chemist/quotations", { method: "POST", body });
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
      title="New quotation"
      width="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button form="new-quotation-form" type="submit" loading={saving}>Create quotation</Button>
        </>
      }
    >
      {error && <Banner message={error} />}
      <form id="new-quotation-form" onSubmit={handleSubmit}>
        <Field label="Approved prescription *" hint="Only prescriptions with status Approved can be quoted">
          {loadingPrescriptions ? (
            <Spinner />
          ) : (
            <Select value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)} required>
              <option value="">Select a prescription…</option>
              {prescriptions.map((p) => (
                <option key={p._id} value={p._id}>{p.prescriptionNumber}</option>
              ))}
            </Select>
          )}
          {!loadingPrescriptions && prescriptions.length === 0 && (
            <span className="block text-xs text-amber-600 mt-1">No approved prescriptions without a quotation yet.</span>
          )}
        </Field>

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
                  <p className="text-xs text-slate-500">Batch {it.batchNumber} · avail {it.available} · mrp {formatMoney(it.mrp)}</p>
                </div>
                <Input
                  type="number" min="1" step="1" value={it.quantity}
                  onChange={(e) => updateItem(it.inventoryId, { quantity: e.target.value })}
                  className="w-20"
                />
                <Input
                  type="number" min="0" max={it.mrp} step="any" value={it.sellingPrice}
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
        <Field label="Valid until (optional)"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
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
