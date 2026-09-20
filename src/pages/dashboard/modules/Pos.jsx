import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, openAuthedFile, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Card, Field, Input, Modal, PageHeader,
  Pagination, Select, Spinner, Table, Textarea, useListQuery, formatMoney, formatDateTime,
} from "../../../components/ui/index.jsx";

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Online"];
const TOKEN_ERROR = /token|authentication|expired/i;

const columns = [
  { key: "saleNumber", label: "Sale #" },
  { key: "customerName", label: "Customer" },
  { key: "items", label: "Items", render: (row) => row.items?.length ?? 0 },
  { key: "grandTotal", label: "Total", render: (row) => formatMoney(row.grandTotal) },
  { key: "paymentMethod", label: "Payment", render: (row) => <Badge tone="indigo">{row.paymentMethod}</Badge> },
  { key: "createdAt", label: "Date", render: (row) => formatDateTime(row.createdAt) },
];

function emptyItemRow(inv) {
  return {
    inventoryId: inv._id,
    masterMedicineId: inv.masterMedicineId,
    medicineName: inv.medicineName,
    batchNumber: inv.batchNumber,
    available: inv.quantity - (inv.reservedQuantity || 0),
    mrp: inv.mrp,
    quantity: 1,
    sellingPrice: inv.mrp,
    discount: 0,
    tax: 0,
  };
}

function lineTotal(item) {
  const gross = item.quantity * item.sellingPrice;
  const afterDiscount = Math.max(0, gross - (Number(item.discount) || 0));
  return afterDiscount + (afterDiscount * (Number(item.tax) || 0)) / 100;
}

export default function Pos() {
  const navigate = useNavigate();
  const list = useListQuery(async ({ page }) => {
    const res = await apiRequest(`/api/chemist/pos${toQuery({ page, limit: 20 })}`);
    return { rows: res.data.data, totalPages: res.data.totalPages };
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (list.error && TOKEN_ERROR.test(list.error)) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [list.error, navigate]);

  function handleCreated(sale) {
    setCreateOpen(false);
    list.reload();
    setSelected(sale);
  }

  return (
    <div>
      <PageHeader
        title="POS Sales"
        subtitle="Walk-in checkout — record a sale and generate its invoice"
        action={<Button onClick={() => setCreateOpen(true)}>New sale</Button>}
      />

      {list.error && !TOKEN_ERROR.test(list.error) && <Banner message={list.error} />}

      {list.loading ? (
        <Spinner />
      ) : (
        <>
          <Table columns={columns} rows={list.rows} onRowClick={setSelected} emptyMessage="No sales recorded yet. Start a new sale to get going." />
          <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
        </>
      )}

      {createOpen && <NewSaleModal onClose={() => setCreateOpen(false)} onCreated={handleCreated} />}
      {selected && <SaleDetailModal sale={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ---------------------------- New sale modal ---------------------------- */

function NewSaleModal({ onClose, onCreated }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [billDiscount, setBillDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      apiRequest(`/api/chemist/inventory${toQuery({ search, limit: 10 })}`)
        .then((res) => { if (!cancelled) setResults(res.data.data); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);

  function addItem(inv) {
    setItems((prev) => (prev.some((i) => i.inventoryId === inv._id) ? prev : [...prev, emptyItemRow(inv)]));
    setSearch("");
    setResults([]);
  }

  function updateItem(inventoryId, patch) {
    setItems((prev) => prev.map((i) => (i.inventoryId === inventoryId ? { ...i, ...patch } : i)));
  }

  function removeItem(inventoryId) {
    setItems((prev) => prev.filter((i) => i.inventoryId !== inventoryId));
  }

  const subTotal = items.reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0);
  const grandTotal = items.reduce((sum, i) => sum + lineTotal(i), 0) - (Number(billDiscount) || 0) + (Number(deliveryFee) || 0);

  async function submit() {
    if (!items.length) { setBanner("Add at least one item."); return; }
    setSaving(true); setBanner("");
    try {
      const body = {
        items: items.map((i) => ({
          inventoryId: i.inventoryId,
          masterMedicineId: i.masterMedicineId,
          quantity: Number(i.quantity),
          sellingPrice: Number(i.sellingPrice),
          discount: Number(i.discount) || 0,
          tax: Number(i.tax) || 0,
        })),
        paymentMethod,
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        discount: Number(billDiscount) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        notes: notes.trim() || undefined,
      };
      const res = await apiRequest("/api/chemist/pos", { method: "POST", body });
      onCreated(res.data);
    } catch (err) {
      setBanner(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New sale"
      width="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={submit}>Complete sale</Button>
        </>
      }
    >
      <Banner message={banner} />

      <Field label="Search inventory to add items" hint="Search by medicine name, batch or barcode">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type to search…" />
      </Field>
      {searching && <p className="text-xs text-slate-400 mb-2">Searching…</p>}
      {results.length > 0 && (
        <div className="border border-slate-200 rounded-lg mb-4 divide-y divide-slate-100 max-h-56 overflow-y-auto">
          {results.map((inv) => (
            <button
              type="button"
              key={inv._id}
              onClick={() => addItem(inv)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
            >
              <span>
                <b>{inv.medicineName}</b>{" "}
                <span className="text-slate-400">Batch {inv.batchNumber} · Qty {inv.quantity - (inv.reservedQuantity || 0)} avail</span>
              </span>
              <span className="text-slate-600">{formatMoney(inv.mrp)}</span>
            </button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="text-left p-1.5 font-medium">Medicine</th>
                <th className="text-left p-1.5 font-medium">Qty</th>
                <th className="text-left p-1.5 font-medium">Price</th>
                <th className="text-left p-1.5 font-medium">Disc.</th>
                <th className="text-left p-1.5 font-medium">Tax %</th>
                <th className="text-left p-1.5 font-medium">Total</th>
                <th className="p-1.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.inventoryId} className="border-t border-slate-100">
                  <td className="p-1.5 align-top">
                    <div className="font-medium">{item.medicineName}</div>
                    <div className="text-xs text-slate-400">Batch {item.batchNumber} · max {item.available}</div>
                  </td>
                  <td className="p-1.5 w-20">
                    <Input
                      type="number" min={1} max={item.available} value={item.quantity}
                      onChange={(e) => updateItem(item.inventoryId, { quantity: Math.max(1, Math.min(item.available, Number(e.target.value) || 1)) })}
                    />
                  </td>
                  <td className="p-1.5 w-24">
                    <Input
                      type="number" min={0} max={item.mrp} step="0.01" value={item.sellingPrice}
                      onChange={(e) => updateItem(item.inventoryId, { sellingPrice: Math.min(item.mrp, Number(e.target.value) || 0) })}
                    />
                  </td>
                  <td className="p-1.5 w-20">
                    <Input type="number" min={0} step="0.01" value={item.discount} onChange={(e) => updateItem(item.inventoryId, { discount: Number(e.target.value) || 0 })} />
                  </td>
                  <td className="p-1.5 w-20">
                    <Input type="number" min={0} step="0.01" value={item.tax} onChange={(e) => updateItem(item.inventoryId, { tax: Number(e.target.value) || 0 })} />
                  </td>
                  <td className="p-1.5 align-top whitespace-nowrap">{formatMoney(lineTotal(item))}</td>
                  <td className="p-1.5 align-top">
                    <button type="button" className="text-red-500 text-xs" onClick={() => removeItem(item.inventoryId)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Customer name"><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></Field>
        <Field label="Payment method">
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Customer phone" hint="10 digits, optional"><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></Field>
        <Field label="Customer email (optional)"><Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} /></Field>
        <Field label="Bill discount"><Input type="number" min={0} step="0.01" value={billDiscount} onChange={(e) => setBillDiscount(e.target.value)} /></Field>
        <Field label="Delivery fee"><Input type="number" min={0} step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} /></Field>
      </div>
      <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>

      <Card className="p-3 mt-2 bg-slate-50">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><b>{formatMoney(subTotal)}</b></div>
        <div className="flex justify-between text-sm mt-1"><span className="text-slate-500">Estimated grand total</span><b>{formatMoney(grandTotal)}</b></div>
        <p className="text-xs text-slate-400 mt-1">Final totals are calculated by the server on submit.</p>
      </Card>
    </Modal>
  );
}

/* ------------------------------ Detail modal ----------------------------- */

function SaleDetailModal({ sale, onClose }) {
  const [invoiceState, setInvoiceState] = useState({ loading: true, invoice: null, emailResult: null, error: "" });
  const [busy, setBusy] = useState(false);
  const [actionBanner, setActionBanner] = useState("");

  useEffect(() => {
    let cancelled = false;
    setInvoiceState({ loading: true, invoice: null, emailResult: null, error: "" });
    apiRequest(`/api/chemist/invoices/sale/${sale._id}`)
      .then((res) => { if (!cancelled) setInvoiceState({ loading: false, invoice: res.data, emailResult: null, error: "" }); })
      .catch(() => { if (!cancelled) setInvoiceState({ loading: false, invoice: null, emailResult: null, error: "" }); });
    return () => { cancelled = true; };
  }, [sale._id]);

  async function generateInvoice() {
    setBusy(true); setActionBanner("");
    try {
      const res = await apiRequest("/api/chemist/invoices", { method: "POST", body: { saleId: sale._id } });
      setInvoiceState({ loading: false, invoice: res.data.invoice, emailResult: res.data.email, error: "" });
    } catch (err) {
      setActionBanner(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resendEmail() {
    if (!invoiceState.invoice) return;
    setBusy(true); setActionBanner("");
    try {
      const res = await apiRequest(`/api/chemist/invoices/${invoiceState.invoice._id}/email`, { method: "POST" });
      setInvoiceState((s) => ({ ...s, emailResult: res.data }));
    } catch (err) {
      setActionBanner(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function viewPdf() {
    if (!invoiceState.invoice) return;
    setBusy(true); setActionBanner("");
    try {
      await openAuthedFile(`/api/chemist/invoices/${invoiceState.invoice._id}/pdf`);
    } catch (err) {
      setActionBanner(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Sale — ${sale.saleNumber}`} width="max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
        <div><span className="text-slate-500">Customer</span><div className="font-medium">{sale.customerName}</div></div>
        <div><span className="text-slate-500">Phone</span><div className="font-medium">{sale.customerPhone || "—"}</div></div>
        <div><span className="text-slate-500">Payment</span><div><Badge tone="indigo">{sale.paymentMethod}</Badge> <Badge>{sale.paymentStatus}</Badge></div></div>
        <div><span className="text-slate-500">Date</span><div className="font-medium">{formatDateTime(sale.createdAt)}</div></div>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="text-left p-1.5 font-medium">Medicine</th>
              <th className="text-left p-1.5 font-medium">Batch</th>
              <th className="text-left p-1.5 font-medium">Qty</th>
              <th className="text-left p-1.5 font-medium">Price</th>
              <th className="text-left p-1.5 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                <td className="p-1.5">{item.medicineName}</td>
                <td className="p-1.5">{item.batchNumber}</td>
                <td className="p-1.5">{item.quantity}</td>
                <td className="p-1.5">{formatMoney(item.sellingPrice)}</td>
                <td className="p-1.5">{formatMoney(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="p-3 bg-slate-50 mb-4">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><b>{formatMoney(sale.subTotal)}</b></div>
        <div className="flex justify-between text-sm mt-1"><span className="text-slate-500">Discount</span><b>-{formatMoney(sale.discount)}</b></div>
        <div className="flex justify-between text-sm mt-1"><span className="text-slate-500">Tax</span><b>{formatMoney(sale.tax)}</b></div>
        <div className="flex justify-between text-sm mt-1 font-bold"><span>Grand total</span><span>{formatMoney(sale.grandTotal)}</span></div>
      </Card>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="font-bold text-sm mb-2">Invoice</h3>
        <Banner message={actionBanner} />
        {invoiceState.loading ? (
          <Spinner />
        ) : invoiceState.invoice ? (
          <div>
            <p className="text-sm mb-2">Invoice <b>{invoiceState.invoice.invoiceNumber}</b> generated.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              <Button size="sm" variant="secondary" loading={busy} onClick={viewPdf}>View PDF</Button>
              <Button size="sm" variant="secondary" loading={busy} onClick={resendEmail}>Resend email</Button>
            </div>
            {invoiceState.emailResult && (
              <p className="text-xs text-slate-500">
                Email: {invoiceState.emailResult.sent ? "sent" : "not sent"}
                {invoiceState.emailResult.reason ? ` (${invoiceState.emailResult.reason})` : ""}
                {invoiceState.emailResult.message ? ` — ${invoiceState.emailResult.message}` : ""}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 mb-2">No invoice generated for this sale yet.</p>
            <Button size="sm" loading={busy} onClick={generateInvoice}>Generate invoice</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
