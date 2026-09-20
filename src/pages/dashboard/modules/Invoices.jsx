import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, openAuthedFile } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Card, Field, Input, PageHeader, Spinner, formatMoney, formatDateTime,
} from "../../../components/ui/index.jsx";

const TOKEN_ERROR = /token|authentication|expired/i;

export default function Invoices() {
  const navigate = useNavigate();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [saleId, setSaleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (error && TOKEN_ERROR.test(error)) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [error, navigate]);

  async function lookupByNumber(e) {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;
    setLoading(true); setError(""); setInvoice(null); setActionMessage("");
    try {
      const res = await apiRequest(`/api/chemist/invoices/number/${encodeURIComponent(invoiceNumber.trim())}`);
      setInvoice(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function lookupBySale(e) {
    e.preventDefault();
    if (!saleId.trim()) return;
    setLoading(true); setError(""); setInvoice(null); setActionMessage("");
    try {
      const res = await apiRequest(`/api/chemist/invoices/sale/${encodeURIComponent(saleId.trim())}`);
      setInvoice(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resendEmail() {
    if (!invoice) return;
    setBusy(true); setActionMessage("");
    try {
      await apiRequest(`/api/chemist/invoices/${invoice._id}/email`, { method: "POST" });
      setActionMessage("Email request sent.");
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadPdf() {
    if (!invoice) return;
    setBusy(true); setActionMessage("");
    try {
      const res = await apiRequest(`/api/chemist/invoices/${invoice._id}/upload-pdf`, { method: "POST" });
      setInvoice((inv) => ({ ...inv, pdfUrl: res.data.pdfUrl }));
      setActionMessage(res.data.alreadyUploaded ? "PDF already uploaded." : "PDF uploaded successfully.");
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function viewPdf() {
    if (!invoice) return;
    setBusy(true); setActionMessage("");
    try {
      await openAuthedFile(`/api/chemist/invoices/${invoice._id}/pdf`);
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={<>Invoices are generated from a POS sale — head to <Link className="text-indigo-600 font-medium" to="/dashboard/pos">POS Sales</Link> to create one. Use this page to look up an existing invoice.</>}
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <h2 className="font-bold text-sm mb-3">Look up by invoice number</h2>
          <form onSubmit={lookupByNumber} className="flex gap-2 items-end">
            <div className="flex-1"><Field label="Invoice number"><Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-…" /></Field></div>
            <Button type="submit" loading={loading} className="mb-3">Look up</Button>
          </form>
        </Card>
        <Card className="p-4">
          <h2 className="font-bold text-sm mb-3">Look up by sale ID</h2>
          <form onSubmit={lookupBySale} className="flex gap-2 items-end">
            <div className="flex-1"><Field label="Sale ID"><Input value={saleId} onChange={(e) => setSaleId(e.target.value)} placeholder="Sale _id…" /></Field></div>
            <Button type="submit" loading={loading} className="mb-3">Look up</Button>
          </form>
        </Card>
      </div>

      {error && !TOKEN_ERROR.test(error) && <Banner message={`No invoice found — ${error}`} />}
      {loading && <Spinner />}

      {invoice && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold">{invoice.invoiceNumber}</h2>
              <p className="text-xs text-slate-400">For sale {invoice.saleNumber}</p>
            </div>
            <Badge>{invoice.paymentStatus}</Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-slate-500">Customer</span><div className="font-medium">{invoice.customerName}</div></div>
            <div><span className="text-slate-500">Phone</span><div className="font-medium">{invoice.customerPhone || "—"}</div></div>
            <div><span className="text-slate-500">Payment method</span><div><Badge tone="indigo">{invoice.paymentMethod}</Badge></div></div>
            <div><span className="text-slate-500">Issued</span><div className="font-medium">{formatDateTime(invoice.issuedAt || invoice.createdAt)}</div></div>
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
                {invoice.items?.map((item, idx) => (
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
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><b>{formatMoney(invoice.subTotal)}</b></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-slate-500">Discount</span><b>-{formatMoney(invoice.discount)}</b></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-slate-500">Tax</span><b>{formatMoney(invoice.tax)}</b></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-slate-500">Delivery fee</span><b>{formatMoney(invoice.deliveryFee)}</b></div>
            <div className="flex justify-between text-sm mt-1 font-bold"><span>Grand total</span><span>{formatMoney(invoice.grandTotal)}</span></div>
          </Card>

          {actionMessage && <Banner type={/fail|error/i.test(actionMessage) ? "error" : "success"} message={actionMessage} />}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" loading={busy} onClick={viewPdf}>View PDF</Button>
            <Button size="sm" variant="secondary" loading={busy} onClick={uploadPdf}>Upload PDF</Button>
            <Button size="sm" variant="secondary" loading={busy} onClick={resendEmail}>Resend email</Button>
          </div>
          {invoice.pdfUrl && <p className="text-xs text-slate-400 mt-2">Stored PDF URL: {invoice.pdfUrl}</p>}
        </Card>
      )}
    </div>
  );
}
