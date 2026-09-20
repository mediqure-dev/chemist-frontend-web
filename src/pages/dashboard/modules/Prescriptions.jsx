import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Field, Input, Modal, PageHeader,
  Pagination, Select, Spinner, Table, Textarea, formatDate, useListQuery,
} from "../../../components/ui/index.jsx";

const STATUS_OPTIONS = ["Pending", "Under Review", "Approved", "Rejected", "Archived"];
const AUTH_ERR = /token|authentication|expired/i;

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url || "");
}

const columns = [
  { key: "prescriptionNumber", label: "Prescription #" },
  { key: "status", label: "Status", render: (row) => <Badge>{row.status}</Badge> },
  { key: "notes", label: "Notes", render: (row) => (row.notes ? (row.notes.length > 40 ? `${row.notes.slice(0, 40)}…` : row.notes) : "—") },
  { key: "createdAt", label: "Date", render: (row) => formatDate(row.createdAt) },
];

export default function Prescriptions() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fileUrl: "", notes: "" });
  const [createBanner, setCreateBanner] = useState("");
  const [creating, setCreating] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detailBanner, setDetailBanner] = useState("");
  const [working, setWorking] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [imgFailed, setImgFailed] = useState(false);

  const list = useListQuery(async ({ page }) => {
    const res = await apiRequest(`/api/chemist/prescriptions${toQuery({ status, page, limit: 20 })}`);
    return { rows: res.data.data, totalPages: res.data.totalPages };
  }, [status]);

  useEffect(() => {
    if (list.error && AUTH_ERR.test(list.error)) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [list.error, navigate]);

  function openCreate() {
    setCreateForm({ fileUrl: "", notes: "" });
    setCreateBanner("");
    setCreateOpen(true);
  }

  async function submitCreate(e) {
    e.preventDefault();
    setCreating(true); setCreateBanner("");
    try {
      await apiRequest("/api/chemist/prescriptions", { method: "POST", body: createForm });
      setCreateOpen(false);
      list.reload();
    } catch (err) {
      setCreateBanner(err.message);
    } finally {
      setCreating(false);
    }
  }

  function openDetail(row) {
    setSelected(row);
    setDetailBanner("");
    setRejectMode(false);
    setRejectReason("");
    setImgFailed(false);
  }

  async function runAction(path, body) {
    setWorking(true); setDetailBanner("");
    try {
      const res = await apiRequest(`/api/chemist/prescriptions/${selected._id}${path}`, { method: "PATCH", body });
      setSelected(res.data);
      list.reload();
      setRejectMode(false);
      setRejectReason("");
    } catch (err) {
      if (AUTH_ERR.test(err.message)) { localStorage.clear(); navigate("/login", { replace: true }); return; }
      setDetailBanner(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function submitReject(e) {
    e.preventDefault();
    if (!rejectReason.trim()) { setDetailBanner("A rejection reason is required."); return; }
    await runAction("/reject", { reason: rejectReason.trim() });
  }

  async function archive() {
    if (!window.confirm("Archive this prescription? This cannot be undone.")) return;
    await runAction("/archive");
  }

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        subtitle="Review customer prescriptions and turn approved ones into quotations"
        action={<Button onClick={openCreate}>Add prescription</Button>}
      />

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
          <Table columns={columns} rows={list.rows} onRowClick={openDetail} emptyMessage="No prescriptions yet. Add one to get started." />
          <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
        </>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add prescription"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={creating} onClick={submitCreate}>Save prescription</Button>
          </>
        }
      >
        <Banner message={createBanner} />
        <form onSubmit={submitCreate}>
          <Field label="Prescription file URL *" hint="Link to the uploaded prescription image/PDF">
            <Input
              type="url"
              value={createForm.fileUrl}
              onChange={(e) => setCreateForm({ ...createForm, fileUrl: e.target.value })}
              placeholder="https://…"
              required
            />
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Prescription ${selected.prescriptionNumber}` : ""}
        footer={
          selected && (
            <>
              {selected.status === "Pending" && (
                <Button loading={working} onClick={() => runAction("/review")}>Start review</Button>
              )}
              {selected.status === "Under Review" && !rejectMode && (
                <>
                  <Button variant="danger" disabled={working} onClick={() => setRejectMode(true)}>Reject</Button>
                  <Button loading={working} onClick={() => runAction("/approve")}>Approve</Button>
                </>
              )}
              {rejectMode && (
                <>
                  <Button variant="secondary" disabled={working} onClick={() => { setRejectMode(false); setRejectReason(""); }}>Cancel</Button>
                  <Button variant="danger" loading={working} onClick={submitReject}>Confirm reject</Button>
                </>
              )}
              {selected.status !== "Archived" && !rejectMode && (
                <Button variant="secondary" disabled={working} onClick={archive}>Archive</Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <div>
            <Banner message={detailBanner} />
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-slate-500">Status:</span>
              <Badge>{selected.status}</Badge>
            </div>

            <Field label="Prescription file">
              <a href={selected.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm break-all hover:underline">
                {selected.fileUrl}
              </a>
              {isImageUrl(selected.fileUrl) && !imgFailed && (
                <img
                  src={selected.fileUrl}
                  alt="Prescription"
                  className="mt-2 max-h-48 rounded-lg border border-slate-200"
                  onError={() => setImgFailed(true)}
                />
              )}
            </Field>

            {selected.notes && (
              <Field label="Notes">
                <p className="text-sm text-slate-700">{selected.notes}</p>
              </Field>
            )}

            {selected.status === "Rejected" && selected.rejectionReason && (
              <Field label="Rejection reason">
                <p className="text-sm text-red-600">{selected.rejectionReason}</p>
              </Field>
            )}

            {rejectMode && (
              <Field label="Rejection reason *" hint="Required to reject this prescription">
                <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection" />
              </Field>
            )}

            {selected.status === "Approved" && !selected.quotationId && (
              <div className="mt-4 p-3 rounded-lg bg-indigo-50 text-sm text-indigo-800">
                Approved — create a quotation for this prescription from the Quotations page using prescription ID:{" "}
                <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-indigo-200 select-all">{selected._id}</span>
              </div>
            )}

            {selected.quotationId && (
              <div className="mt-4 p-3 rounded-lg bg-slate-50 text-sm text-slate-600">
                Linked quotation ID: <span className="font-mono text-xs">{selected.quotationId}</span>
              </div>
            )}

            {selected.orderId && (
              <div className="mt-2 p-3 rounded-lg bg-slate-50 text-sm text-slate-600">
                Linked order ID: <span className="font-mono text-xs">{selected.orderId}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
