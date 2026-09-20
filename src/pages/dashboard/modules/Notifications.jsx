import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Card, Modal, PageHeader,
  Select, Spinner, Table, formatDateTime,
} from "../../../components/ui/index.jsx";

const CHANNELS = ["email"];
const STATUSES = ["pending", "sent", "failed"];

const columns = [
  { key: "customerName", label: "Customer", render: (row) => row.customerName || "—" },
  { key: "channel", label: "Channel", render: (row) => <Badge>{row.channel}</Badge> },
  { key: "type", label: "Type" },
  { key: "status", label: "Status", render: (row) => <Badge>{row.status}</Badge> },
  { key: "sentAt", label: "Sent", render: (row) => formatDateTime(row.sentAt || row.createdAt) },
  { key: "error", label: "Error", render: (row) => row.error ? <span className="text-red-600 text-xs">{row.error}</span> : "—" },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailBanner, setDetailBanner] = useState("");
  const [retrying, setRetrying] = useState(false);

  const [emailStatus, setEmailStatus] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  async function checkEmailStatus() {
    setCheckingEmail(true); setEmailStatus(null);
    try {
      const res = await apiRequest("/api/chemist/notifications/email/status");
      setEmailStatus(res.data);
    } catch (err) {
      setEmailStatus({ success: false, message: err.message });
    } finally {
      setCheckingEmail(false);
    }
  }

  function load() {
    setLoading(true); setError("");
    apiRequest(`/api/chemist/notifications${toQuery({ page: 1, limit: 100, channel: channelFilter, status: statusFilter })}`)
      .then((res) => setNotifications(res.data || []))
      .catch((err) => {
        setError(err.message);
        if (/token|authentication|expired/i.test(err.message)) { localStorage.clear(); navigate("/login", { replace: true }); }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelFilter, statusFilter]);

  function openDetail(row) {
    setSelected(row);
    setDetailBanner("");
  }

  async function retryInvoice() {
    if (!selected?.invoiceId) { setDetailBanner("No invoice linked to this notification."); return; }
    setRetrying(true); setDetailBanner("");
    try {
      const res = await apiRequest(`/api/chemist/notifications/invoice/${selected.invoiceId}/retry`, { method: "POST" });
      setDetailBanner(res.message || "Retry sent.");
      load();
    } catch (err) {
      setDetailBanner(err.message);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Delivery log for customer notifications" />

      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <div>
            <h2 className="font-bold">Email service status</h2>
            <p className="text-sm text-slate-500">Tests the SMTP connection this backend actually uses to send invoice emails.</p>
          </div>
          <Button size="sm" variant="secondary" loading={checkingEmail} onClick={checkEmailStatus}>Check connection</Button>
        </div>
        {emailStatus && (
          <Banner
            type={emailStatus.success ? "success" : "error"}
            message={
              emailStatus.configured === false
                ? "Not configured — EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASSWORD are missing on this backend."
                : (emailStatus.error ? `${emailStatus.message} — ${emailStatus.error}` : emailStatus.message)
            }
          />
        )}
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="max-w-xs">
          <option value="">All channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {error && !/token|authentication|expired/i.test(error) && <Banner message={error} />}

      {loading ? (
        <Spinner />
      ) : (
        <Table columns={columns} rows={notifications} rowKey="_id" onRowClick={openDetail} emptyMessage="No notifications yet." />
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Notification — ${selected.customerName || selected.type}` : ""}
        footer={
          selected && (
            <Button loading={retrying} disabled={!selected.invoiceId} onClick={retryInvoice}>Retry send</Button>
          )
        }
      >
        {selected && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge>{selected.channel}</Badge>
              <Badge>{selected.status}</Badge>
              <span className="text-sm text-slate-500">{selected.type}</span>
            </div>
            <Banner message={detailBanner} />
            <p className="text-sm mb-1"><span className="text-slate-500">Customer:</span> {selected.customerName || "—"}</p>
            <p className="text-sm mb-1"><span className="text-slate-500">Phone:</span> {selected.customerPhone || "—"}</p>
            <p className="text-sm mb-1"><span className="text-slate-500">Email:</span> {selected.customerEmail || "—"}</p>
            <p className="text-sm mb-1"><span className="text-slate-500">Attempts:</span> {selected.attempts ?? "—"}</p>
            <p className="text-sm mb-1"><span className="text-slate-500">Sent at:</span> {formatDateTime(selected.sentAt)}</p>
            <p className="text-sm mb-1"><span className="text-slate-500">Created:</span> {formatDateTime(selected.createdAt)}</p>
            {selected.documentUrl && (
              <p className="text-sm mb-1">
                <span className="text-slate-500">Document:</span>{" "}
                <a href={selected.documentUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">View document</a>
              </p>
            )}
            {selected.error && <p className="text-sm mb-1 text-red-600"><span className="text-slate-500">Error:</span> {selected.error}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
