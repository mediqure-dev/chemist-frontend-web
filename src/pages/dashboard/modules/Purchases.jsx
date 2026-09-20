import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Card, Field, Input, Modal, PageHeader,
  Pagination, SearchBox, Select, Spinner, Table, formatDate, formatMoney, useListQuery,
} from "../../../components/ui/index.jsx";

const STATUS_OPTIONS = ["Draft", "Ordered", "Partially Received", "Received", "Cancelled"];
const STATUS_ACTIONS = ["Draft", "Ordered", "Cancelled"];

function emptyItemRow() {
  return { masterMedicineId: "", medicineName: "", batchNumber: "", quantity: "", purchasePrice: "", mrp: "", expiryDate: "" };
}

export default function Purchases() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [banner, setBanner] = useState(null);

  const list = useListQuery(async ({ page, search }) => {
    const res = await apiRequest(`/api/chemist/purchases${toQuery({ page, limit: 20, search, status: statusFilter })}`);
    return { rows: res.data.data, totalPages: res.data.totalPages, page: res.data.page };
  }, [statusFilter]);

  function handleAuthError(err) {
    if (/token|authentication|expired/i.test(err.message)) {
      localStorage.clear();
      navigate("/login", { replace: true });
      return true;
    }
    return false;
  }

  useEffect(() => {
    apiRequest("/api/chemist/suppliers" + toQuery({ limit: 100 }))
      .then((res) => setSuppliers(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (list.error) handleAuthError(new Error(list.error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.error]);

  const supplierLabel = (row) => {
    if (row.supplierId && typeof row.supplierId === "object") return row.supplierId.name || "—";
    const match = suppliers.find((s) => s._id === row.supplierId);
    return match ? match.name : (row.supplierId ? String(row.supplierId).slice(-6) : "—");
  };

  const columns = [
    { key: "purchaseNumber", label: "Purchase #" },
    { key: "supplier", label: "Supplier", render: supplierLabel },
    { key: "status", label: "Status", render: (row) => <Badge>{row.status}</Badge> },
    { key: "grandTotal", label: "Grand total", render: (row) => formatMoney(row.grandTotal) },
    { key: "purchaseDate", label: "Date", render: (row) => formatDate(row.purchaseDate) },
  ];

  return (
    <div>
      <PageHeader
        title="Purchases"
        subtitle="Create purchase orders and receive stock from suppliers"
        action={<Button onClick={() => setCreateOpen(true)}>New purchase</Button>}
      />
      <Banner type={banner?.type} message={banner?.message} />
      {list.error && <Banner message={list.error} />}

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search purchase #, invoice #…" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="p-4">
        {list.loading ? <Spinner /> : (
          <Table columns={columns} rows={list.rows} onRowClick={setDetail} emptyMessage="No purchases found." />
        )}
        <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
      </Card>

      {createOpen && (
        <CreatePurchaseModal
          suppliers={suppliers}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); setBanner({ type: "success", message: "Purchase created." }); list.reload(); }}
          onError={(msg) => setBanner({ type: "error", message: msg })}
        />
      )}

      {detail && (
        <DetailModal
          purchaseId={detail._id}
          initial={detail}
          suppliers={suppliers}
          onClose={() => setDetail(null)}
          onChanged={(msg) => { setBanner({ type: "success", message: msg }); list.reload(); }}
          onError={(msg) => setBanner({ type: "error", message: msg })}
        />
      )}
    </div>
  );
}

function MedicinePicker({ onSelect, placeholder = "Search medicine…" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      apiRequest(`/api/medicines${toQuery({ q: query, limit: 10 })}`)
        .then((res) => { if (!cancelled) setResults(res.data.data || []); })
        .catch(() => {});
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full border border-slate-200 rounded-lg bg-white shadow-md max-h-40 overflow-y-auto">
          {results.map((m) => (
            <button
              type="button"
              key={m._id}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => { onSelect(m); setQuery(""); setResults([]); setOpen(false); }}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRowEditor({ items, setItems }) {
  function updateRow(idx, patch) {
    setItems(items.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function removeRow(idx) {
    setItems(items.filter((_, i) => i !== idx));
  }
  return (
    <div className="space-y-3">
      {items.map((row, idx) => (
        <Card key={idx} className="p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500">Item {idx + 1}{row.medicineName ? ` — ${row.medicineName}` : ""}</span>
            {items.length > 1 && (
              <button type="button" className="text-xs text-red-600 font-semibold" onClick={() => removeRow(idx)}>Remove</button>
            )}
          </div>
          {!row.masterMedicineId && (
            <MedicinePicker onSelect={(m) => updateRow(idx, { masterMedicineId: m._id, medicineName: m.name })} />
          )}
          {row.masterMedicineId && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Field label="Batch number"><Input value={row.batchNumber} onChange={(e) => updateRow(idx, { batchNumber: e.target.value })} required /></Field>
              <Field label="Quantity"><Input type="number" min="1" value={row.quantity} onChange={(e) => updateRow(idx, { quantity: e.target.value })} required /></Field>
              <Field label="Purchase price"><Input type="number" min="0" step="0.01" value={row.purchasePrice} onChange={(e) => updateRow(idx, { purchasePrice: e.target.value })} required /></Field>
              <Field label="MRP"><Input type="number" min="0" step="0.01" value={row.mrp} onChange={(e) => updateRow(idx, { mrp: e.target.value })} required /></Field>
              <Field label="Expiry date"><Input type="date" value={row.expiryDate} onChange={(e) => updateRow(idx, { expiryDate: e.target.value })} required /></Field>
              <div className="flex items-end">
                <button type="button" className="text-xs text-indigo-600 font-semibold mb-3" onClick={() => updateRow(idx, { masterMedicineId: "", medicineName: "" })}>
                  Change medicine
                </button>
              </div>
            </div>
          )}
        </Card>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => setItems([...items, emptyItemRow()])}>+ Add item</Button>
    </div>
  );
}

function CreatePurchaseModal({ suppliers, onClose, onCreated, onError }) {
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([emptyItemRow()]);
  const [meta, setMeta] = useState({ supplierInvoiceNumber: "", purchaseDate: "", discount: "", tax: "", notes: "", status: "Draft" });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!supplierId) { onError("Please select a supplier."); return; }
    const validItems = items.filter((i) => i.masterMedicineId);
    if (!validItems.length) { onError("Add at least one item."); return; }
    setSaving(true);
    try {
      const body = {
        supplierId,
        items: validItems.map((i) => ({
          masterMedicineId: i.masterMedicineId,
          batchNumber: i.batchNumber,
          quantity: Number(i.quantity),
          purchasePrice: Number(i.purchasePrice),
          mrp: Number(i.mrp),
          expiryDate: i.expiryDate,
        })),
        supplierInvoiceNumber: meta.supplierInvoiceNumber || undefined,
        purchaseDate: meta.purchaseDate || undefined,
        discount: meta.discount ? Number(meta.discount) : undefined,
        tax: meta.tax ? Number(meta.tax) : undefined,
        notes: meta.notes || undefined,
        status: meta.status,
      };
      await apiRequest("/api/chemist/purchases", { method: "POST", body });
      onCreated();
    } catch (err) { onError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="New purchase" width="max-w-3xl" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button form="create-purchase-form" type="submit" loading={saving}>Create purchase</Button>
      </>
    }>
      <form id="create-purchase-form" onSubmit={submit}>
        <Field label="Supplier">
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
            <option value="">— Select supplier —</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </Field>

        <h3 className="font-semibold text-sm mb-2 mt-4">Items</h3>
        <ItemRowEditor items={items} setItems={setItems} />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Field label="Invoice number (optional)"><Input value={meta.supplierInvoiceNumber} onChange={(e) => setMeta({ ...meta, supplierInvoiceNumber: e.target.value })} /></Field>
          <Field label="Purchase date (optional)"><Input type="date" value={meta.purchaseDate} onChange={(e) => setMeta({ ...meta, purchaseDate: e.target.value })} /></Field>
          <Field label="Discount (optional)"><Input type="number" min="0" step="0.01" value={meta.discount} onChange={(e) => setMeta({ ...meta, discount: e.target.value })} /></Field>
          <Field label="Tax (optional)"><Input type="number" min="0" step="0.01" value={meta.tax} onChange={(e) => setMeta({ ...meta, tax: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={meta.status} onChange={(e) => setMeta({ ...meta, status: e.target.value })}>
              <option value="Draft">Draft</option>
              <option value="Ordered">Ordered</option>
            </Select>
          </Field>
        </div>
        <Field label="Notes (optional)"><Input value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} /></Field>
      </form>
    </Modal>
  );
}

function DetailModal({ purchaseId, initial, suppliers, onClose, onChanged, onError }) {
  const [purchase, setPurchase] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(initial.status);
  const [receiveQty, setReceiveQty] = useState({});

  useEffect(() => {
    apiRequest(`/api/chemist/purchases/${purchaseId}`)
      .then((res) => { setPurchase(res.data); setStatus(res.data.status); })
      .catch((err) => onError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId]);

  const supplierLabel = (() => {
    if (purchase.supplierId && typeof purchase.supplierId === "object") return purchase.supplierId.name || "—";
    const match = suppliers.find((s) => s._id === purchase.supplierId);
    return match ? match.name : "—";
  })();

  async function updateStatus() {
    setBusy(true);
    try {
      const res = await apiRequest(`/api/chemist/purchases/${purchaseId}/status`, { method: "PATCH", body: { status } });
      setPurchase(res.data);
      onChanged("Purchase status updated.");
    } catch (err) { onError(err.message); }
    finally { setBusy(false); }
  }

  async function submitReceive() {
    const receiveItems = purchase.items
      .map((item, idx) => ({ item, idx, qty: Number(receiveQty[idx] || 0) }))
      .filter((r) => r.qty > 0)
      .map((r) => ({
        masterMedicineId: r.item.masterMedicineId,
        batchNumber: r.item.batchNumber,
        quantity: r.qty,
      }));
    if (!receiveItems.length) { onError("Enter a quantity to receive for at least one item."); return; }
    setBusy(true);
    try {
      const res = await apiRequest(`/api/chemist/purchases/${purchaseId}/receive`, { method: "POST", body: { items: receiveItems } });
      setPurchase(res.data);
      setReceiveQty({});
      onChanged("Items received.");
    } catch (err) { onError(err.message); }
    finally { setBusy(false); }
  }

  const itemColumns = [
    { key: "medicineName", label: "Medicine" },
    { key: "batchNumber", label: "Batch" },
    { key: "quantity", label: "Ordered" },
    { key: "receivedQuantity", label: "Received" },
    { key: "purchasePrice", label: "Price", render: (row) => formatMoney(row.purchasePrice) },
    { key: "mrp", label: "MRP", render: (row) => formatMoney(row.mrp) },
    { key: "total", label: "Total", render: (row) => formatMoney(row.total) },
  ];

  const canReceive = purchase.status !== "Received" && purchase.status !== "Cancelled";

  return (
    <Modal open onClose={onClose} title={purchase.purchaseNumber} width="max-w-3xl" footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      {loading ? <Spinner /> : (
        <>
          <div className="grid sm:grid-cols-2 gap-2 text-sm mb-4">
            <p><span className="text-slate-500">Supplier:</span> {supplierLabel}</p>
            <p><span className="text-slate-500">Status:</span> <Badge>{purchase.status}</Badge></p>
            <p><span className="text-slate-500">Invoice #:</span> {purchase.supplierInvoiceNumber || "—"}</p>
            <p><span className="text-slate-500">Date:</span> {formatDate(purchase.purchaseDate)}</p>
          </div>

          <Table columns={itemColumns} rows={purchase.items} rowKey="batchNumber" />

          <div className="grid sm:grid-cols-3 gap-2 text-sm mt-3 mb-4">
            <p><span className="text-slate-500">Subtotal:</span> {formatMoney(purchase.subTotal)}</p>
            <p><span className="text-slate-500">Discount:</span> {formatMoney(purchase.discount)}</p>
            <p><span className="text-slate-500">Tax:</span> {formatMoney(purchase.tax)}</p>
            <p className="font-semibold"><span className="text-slate-500 font-normal">Grand total:</span> {formatMoney(purchase.grandTotal)}</p>
          </div>

          {purchase.status !== "Received" && (
            <Card className="p-3 mb-4">
              <h3 className="font-semibold text-sm mb-2">Update status</h3>
              <div className="flex items-center gap-2">
                <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
                  {STATUS_ACTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Button size="sm" variant="secondary" disabled={busy} onClick={updateStatus}>Update</Button>
              </div>
            </Card>
          )}

          {canReceive && (
            <Card className="p-3">
              <h3 className="font-semibold text-sm mb-2">Receive items</h3>
              <div className="space-y-2">
                {purchase.items.map((item, idx) => {
                  const remaining = item.quantity - item.receivedQuantity;
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                      <span>{item.medicineName} <span className="text-slate-400">({item.batchNumber})</span></span>
                      <span className="text-slate-500">Remaining: {remaining}</span>
                      <Input
                        type="number" min="0" max={remaining}
                        value={receiveQty[idx] || ""}
                        onChange={(e) => setReceiveQty({ ...receiveQty, [idx]: e.target.value })}
                        className="max-w-[90px]"
                        disabled={remaining <= 0}
                      />
                    </div>
                  );
                })}
              </div>
              <Button size="sm" className="mt-3" disabled={busy} onClick={submitReceive}>Submit receipt</Button>
            </Card>
          )}
        </>
      )}
    </Modal>
  );
}
