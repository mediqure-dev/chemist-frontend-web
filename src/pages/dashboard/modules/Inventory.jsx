import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Card, Field, Input, Modal, PageHeader,
  Pagination, SearchBox, Select, Spinner, Table, formatDate, formatMoney, useListQuery,
} from "../../../components/ui/index.jsx";

const emptyForm = {
  batchNumber: "", quantity: "", purchasePrice: "", mrp: "", expiryDate: "",
  reorderLevel: "", barcode: "", qrCode: "", supplierId: "",
};

export default function Inventory() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("all"); // all | low | expiring
  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [banner, setBanner] = useState(null);

  const list = useListQuery(async ({ page, search }) => {
    const res = await apiRequest(`/api/chemist/inventory${toQuery({ page, limit: 20, search })}`);
    return { rows: res.data.data, totalPages: res.data.totalPages, page: res.data.page };
  }, [mode]);

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
    if (mode === "all") return;
    let cancelled = false;
    setReportLoading(true);
    setReportError("");
    const path = mode === "low"
      ? "/api/chemist/inventory/reports/low-stock"
      : "/api/chemist/inventory/reports/expiry?days=90";
    apiRequest(path)
      .then((res) => { if (!cancelled) setReportRows(res.data || []); })
      .catch((err) => { if (!cancelled) { setReportError(err.message); handleAuthError(err); } })
      .finally(() => { if (!cancelled) setReportLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (list.error) handleAuthError(new Error(list.error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.error]);

  const supplierName = (id) => suppliers.find((s) => s._id === id)?.name || "—";

  function refreshReport() {
    const path = mode === "low"
      ? "/api/chemist/inventory/reports/low-stock"
      : "/api/chemist/inventory/reports/expiry?days=90";
    setReportLoading(true);
    apiRequest(path)
      .then((res) => setReportRows(res.data || []))
      .catch((err) => { setReportError(err.message); handleAuthError(err); })
      .finally(() => setReportLoading(false));
  }

  function refreshAll() {
    if (mode === "all") list.reload();
    else refreshReport();
  }

  const columns = [
    { key: "medicineName", label: "Medicine" },
    { key: "batchNumber", label: "Batch" },
    {
      key: "quantity", label: "Quantity",
      render: (row) => (
        <span className="flex items-center gap-2">
          {row.quantity}
          {row.quantity <= row.reorderLevel && <Badge tone={row.quantity === 0 ? "red" : "amber"}>Low</Badge>}
        </span>
      ),
    },
    { key: "mrp", label: "MRP", render: (row) => formatMoney(row.mrp) },
    {
      key: "expiryDate", label: "Expiry",
      render: (row) => {
        const days = (new Date(row.expiryDate) - new Date()) / 86400000;
        return <span className={days <= 90 ? "text-amber-600 font-semibold" : ""}>{formatDate(row.expiryDate)}</span>;
      },
    },
    { key: "status", label: "Status", render: (row) => <Badge>{row.status}</Badge> },
  ];

  const rows = mode === "all" ? list.rows : reportRows;
  const loading = mode === "all" ? list.loading : reportLoading;
  const error = mode === "all" ? list.error : reportError;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track stock batches, low-stock alerts and expiring medicines"
        action={<Button onClick={() => setAddOpen(true)}>Add stock</Button>}
      />
      <Banner type={banner?.type} message={banner?.message} />
      {error && <Banner message={error} />}

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-2">
            <Button variant={mode === "all" ? "primary" : "secondary"} size="sm" onClick={() => setMode("all")}>All stock</Button>
            <Button variant={mode === "low" ? "primary" : "secondary"} size="sm" onClick={() => setMode("low")}>Low stock</Button>
            <Button variant={mode === "expiring" ? "primary" : "secondary"} size="sm" onClick={() => setMode("expiring")}>Expiring soon</Button>
          </div>
          {mode === "all" && <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search medicine, batch, barcode…" />}
        </div>
      </Card>

      <Card className="p-4">
        {loading ? <Spinner /> : (
          <Table columns={columns} rows={rows} onRowClick={setDetailItem} emptyMessage="No inventory items found." />
        )}
        {mode === "all" && <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />}
      </Card>

      {addOpen && (
        <AddStockModal
          suppliers={suppliers}
          onClose={() => setAddOpen(false)}
          onCreated={() => { setAddOpen(false); setBanner({ type: "success", message: "Stock added." }); refreshAll(); }}
          onError={(msg) => setBanner({ type: "error", message: msg })}
        />
      )}

      {detailItem && (
        <DetailModal
          item={detailItem}
          suppliers={suppliers}
          supplierName={supplierName}
          onClose={() => setDetailItem(null)}
          onChanged={(msg) => { setBanner({ type: "success", message: msg }); refreshAll(); }}
          onError={(msg) => setBanner({ type: "error", message: msg })}
          onDeactivated={() => { setDetailItem(null); setBanner({ type: "success", message: "Item deactivated." }); refreshAll(); }}
        />
      )}
    </div>
  );
}

function MedicinePicker({ value, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(value || null);
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
    <Field label="Medicine" hint={selected ? `Selected: ${selected.name}` : "Type to search master medicine list"}>
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder="Search medicine by name…"
      />
      {open && results.length > 0 && (
        <div className="mt-1 border border-slate-200 rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto">
          {results.map((m) => (
            <button
              type="button"
              key={m._id}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => { setSelected(m); onSelect(m); setQuery(m.name); setOpen(false); }}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

function AddStockModal({ suppliers, onClose, onCreated, onError }) {
  const [medicine, setMedicine] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!medicine) { onError("Please select a medicine."); return; }
    setSaving(true);
    try {
      const body = {
        masterMedicineId: medicine._id,
        batchNumber: form.batchNumber,
        quantity: Number(form.quantity),
        purchasePrice: Number(form.purchasePrice),
        mrp: Number(form.mrp),
        expiryDate: form.expiryDate,
        reorderLevel: form.reorderLevel ? Number(form.reorderLevel) : undefined,
        barcode: form.barcode || undefined,
        qrCode: form.qrCode || undefined,
        supplierId: form.supplierId || undefined,
      };
      await apiRequest("/api/chemist/inventory", { method: "POST", body });
      onCreated();
    } catch (err) { onError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Add stock" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button form="add-stock-form" type="submit" loading={saving}>Save</Button>
      </>
    }>
      <form id="add-stock-form" onSubmit={submit}>
        <MedicinePicker value={medicine} onSelect={setMedicine} />
        <Field label="Batch number"><Input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity"><Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></Field>
          <Field label="Reorder level" hint="Default 10"><Input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></Field>
          <Field label="Purchase price"><Input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required /></Field>
          <Field label="MRP"><Input type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} required /></Field>
        </div>
        <Field label="Expiry date"><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Barcode (optional)"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Field>
          <Field label="QR code (optional)"><Input value={form.qrCode} onChange={(e) => setForm({ ...form, qrCode: e.target.value })} /></Field>
        </div>
        <Field label="Supplier (optional)">
          <Select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
            <option value="">— Select supplier —</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

function DetailModal({ item, suppliers, supplierName, onClose, onChanged, onError, onDeactivated }) {
  const [busy, setBusy] = useState(false);
  const [adjustQty, setAdjustQty] = useState("");
  const [form, setForm] = useState({
    batchNumber: item.batchNumber || "",
    quantity: item.quantity ?? "",
    purchasePrice: item.purchasePrice ?? "",
    mrp: item.mrp ?? "",
    expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : "",
    reorderLevel: item.reorderLevel ?? "",
    barcode: item.barcode || "",
    qrCode: item.qrCode || "",
    supplierId: typeof item.supplierId === "object" ? item.supplierId?._id || "" : item.supplierId || "",
  });

  async function adjust(direction) {
    const qty = Number(adjustQty);
    if (!Number.isInteger(qty) || qty <= 0) { onError("Enter a valid positive quantity."); return; }
    setBusy(true);
    try {
      await apiRequest(`/api/chemist/inventory/${item._id}/${direction}`, { method: "PATCH", body: { quantity: qty } });
      onChanged(`Stock ${direction === "add" ? "increased" : "decreased"}.`);
      onClose();
    } catch (err) { onError(err.message); }
    finally { setBusy(false); }
  }

  async function saveEdit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        batchNumber: form.batchNumber,
        quantity: Number(form.quantity),
        purchasePrice: Number(form.purchasePrice),
        mrp: Number(form.mrp),
        expiryDate: form.expiryDate,
        reorderLevel: Number(form.reorderLevel),
        barcode: form.barcode || undefined,
        qrCode: form.qrCode || undefined,
        supplierId: form.supplierId || undefined,
      };
      await apiRequest(`/api/chemist/inventory/${item._id}`, { method: "PUT", body });
      onChanged("Inventory item updated.");
      onClose();
    } catch (err) { onError(err.message); }
    finally { setBusy(false); }
  }

  async function deactivate() {
    if (!window.confirm("Deactivate this inventory item?")) return;
    setBusy(true);
    try {
      await apiRequest(`/api/chemist/inventory/${item._id}`, { method: "DELETE" });
      onDeactivated();
    } catch (err) { onError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={item.medicineName} width="max-w-2xl" footer={
      <>
        <Button variant="danger" onClick={deactivate} disabled={busy}>Deactivate</Button>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button form="edit-inventory-form" type="submit" loading={busy}>Save changes</Button>
      </>
    }>
      <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
        <p><span className="text-slate-500">Reserved qty:</span> {item.reservedQuantity ?? 0}</p>
        <p><span className="text-slate-500">Supplier:</span> {supplierName(typeof item.supplierId === "object" ? item.supplierId?._id : item.supplierId)}</p>
        <p><span className="text-slate-500">Created:</span> {formatDate(item.createdAt)}</p>
        <p><span className="text-slate-500">Updated:</span> {formatDate(item.updatedAt)}</p>
      </div>

      <Card className="p-3 mb-4">
        <h3 className="font-semibold text-sm mb-2">Quick stock adjust</h3>
        <div className="flex items-center gap-2">
          <Input type="number" min="1" placeholder="Qty" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="max-w-[100px]" />
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => adjust("add")}>Add stock</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => adjust("reduce")}>Reduce stock</Button>
        </div>
      </Card>

      <form id="edit-inventory-form" onSubmit={saveEdit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Batch number"><Input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} required /></Field>
          <Field label="Quantity"><Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></Field>
          <Field label="Purchase price"><Input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required /></Field>
          <Field label="MRP"><Input type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} required /></Field>
          <Field label="Reorder level"><Input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} required /></Field>
          <Field label="Expiry date"><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required /></Field>
          <Field label="Barcode"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Field>
          <Field label="QR code"><Input value={form.qrCode} onChange={(e) => setForm({ ...form, qrCode: e.target.value })} /></Field>
        </div>
        <Field label="Supplier">
          <Select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
            <option value="">— None —</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
