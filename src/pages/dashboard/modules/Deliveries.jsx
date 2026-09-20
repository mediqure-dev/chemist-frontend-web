import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Card, Field, Input, Modal, PageHeader,
  Select, Spinner, Table, Textarea,
} from "../../../components/ui/index.jsx";

const TRANSITIONS = {
  Pending: ["Assigned", "Cancelled"],
  Assigned: ["Picked Up", "Cancelled"],
  "Picked Up": ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

const TERMINAL = ["Delivered", "Cancelled"];

const STATUS_OPTIONS = ["Pending", "Assigned", "Picked Up", "Out for Delivery", "Delivered", "Cancelled"];

const columns = [
  { key: "deliveryNumber", label: "Delivery #" },
  { key: "orderId", label: "Order", render: (row) => row.orderId?.orderNumber || row.orderId?._id || row.orderId || "—" },
  { key: "status", label: "Status", render: (row) => <Badge>{row.status}</Badge> },
  { key: "deliveryPartnerId", label: "Partner", render: (row) => row.deliveryPartnerId || "—" },
  { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Deliveries() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [readyOrders, setReadyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ orderId: "", deliveryAddress: "", notes: "" });
  const [createBanner, setCreateBanner] = useState("");
  const [creating, setCreating] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detailBanner, setDetailBanner] = useState("");
  const [detailBusy, setDetailBusy] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [coords, setCoords] = useState({ latitude: "", longitude: "" });

  function load() {
    setLoading(true); setError("");
    apiRequest(`/api/chemist/deliveries${toQuery({ status: statusFilter })}`)
      .then((res) => setDeliveries(res.deliveries || []))
      .catch((err) => {
        setError(err.message);
        if (/token|authentication|expired/i.test(err.message)) { localStorage.clear(); navigate("/login", { replace: true }); }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function openCreate() {
    setCreateForm({ orderId: "", deliveryAddress: "", notes: "" });
    setCreateBanner("");
    setCreateOpen(true);
    setOrdersLoading(true);
    apiRequest(`/api/chemist/orders${toQuery({ status: "Ready", limit: 50 })}`)
      .then((res) => setReadyOrders(res.data?.data || []))
      .catch((err) => setCreateBanner(err.message))
      .finally(() => setOrdersLoading(false));
  }

  async function submitCreate(e) {
    e.preventDefault();
    if (!createForm.orderId) { setCreateBanner("Please select an order."); return; }
    setCreating(true); setCreateBanner("");
    try {
      await apiRequest("/api/chemist/deliveries", { method: "POST", body: createForm });
      setCreateOpen(false);
      load();
    } catch (err) {
      setCreateBanner(err.message);
    } finally {
      setCreating(false);
    }
  }

  function openDetail(row) {
    setSelected(row);
    setDetailBanner("");
    setPartnerId("");
    setCoords({ latitude: row.currentLocation?.latitude ?? "", longitude: row.currentLocation?.longitude ?? "" });
  }

  async function refreshSelected(id) {
    try {
      const res = await apiRequest(`/api/chemist/deliveries/${id}`);
      setSelected(res.delivery);
    } catch {
      // ignore, list reload will still happen
    }
  }

  async function assignPartner() {
    if (!partnerId.trim()) { setDetailBanner("Enter a delivery partner ID."); return; }
    setDetailBusy(true); setDetailBanner("");
    try {
      await apiRequest(`/api/chemist/deliveries/${selected._id}/assign`, { method: "PATCH", body: { deliveryPartnerId: partnerId.trim() } });
      await refreshSelected(selected._id);
      load();
    } catch (err) {
      setDetailBanner(err.message);
    } finally {
      setDetailBusy(false);
    }
  }

  async function advanceStatus(nextStatus) {
    if (nextStatus === "Cancelled" && !window.confirm("Cancel this delivery? This cannot be undone.")) return;
    setDetailBusy(true); setDetailBanner("");
    try {
      await apiRequest(`/api/chemist/deliveries/${selected._id}/status`, { method: "PATCH", body: { status: nextStatus } });
      await refreshSelected(selected._id);
      load();
    } catch (err) {
      setDetailBanner(err.message);
    } finally {
      setDetailBusy(false);
    }
  }

  async function cancelDelivery() {
    if (!window.confirm("Cancel this delivery? This cannot be undone.")) return;
    setDetailBusy(true); setDetailBanner("");
    try {
      await apiRequest(`/api/chemist/deliveries/${selected._id}/cancel`, { method: "PATCH" });
      await refreshSelected(selected._id);
      load();
    } catch (err) {
      setDetailBanner(err.message);
    } finally {
      setDetailBusy(false);
    }
  }

  async function updateLocation(e) {
    e.preventDefault();
    setDetailBusy(true); setDetailBanner("");
    try {
      await apiRequest(`/api/chemist/deliveries/${selected._id}/location`, {
        method: "PATCH",
        body: { latitude: Number(coords.latitude), longitude: Number(coords.longitude) },
      });
      await refreshSelected(selected._id);
      load();
    } catch (err) {
      setDetailBanner(err.message);
    } finally {
      setDetailBusy(false);
    }
  }

  const nextStatuses = selected ? TRANSITIONS[selected.status] || [] : [];
  const isTerminal = selected && TERMINAL.includes(selected.status);

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Track and manage order deliveries"
        action={<Button onClick={openCreate}>New delivery</Button>}
      />

      <div className="mb-4 flex items-center gap-3">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {error && !/token|authentication|expired/i.test(error) && <Banner message={error} />}

      {loading ? (
        <Spinner />
      ) : (
        <Table columns={columns} rows={deliveries} rowKey="_id" onRowClick={openDetail} emptyMessage="No deliveries yet. Create one from a ready order." />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New delivery"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={creating} onClick={submitCreate}>Create delivery</Button>
          </>
        }
      >
        <Banner message={createBanner} />
        <form onSubmit={(e) => e.preventDefault()}>
          <Field label="Order (must be Ready) *">
            {ordersLoading ? (
              <Spinner />
            ) : (
              <Select value={createForm.orderId} onChange={(e) => setCreateForm({ ...createForm, orderId: e.target.value })} required>
                <option value="">Select an order…</option>
                {readyOrders.map((o) => (
                  <option key={o._id} value={o._id}>{o.orderNumber || o._id}</option>
                ))}
              </Select>
            )}
            {!ordersLoading && !readyOrders.length && (
              <span className="block text-xs text-slate-400 mt-1">No orders with status "Ready" available.</span>
            )}
          </Field>
          <Field label="Delivery address">
            <Textarea rows={2} value={createForm.deliveryAddress} onChange={(e) => setCreateForm({ ...createForm, deliveryAddress: e.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Delivery — ${selected.deliveryNumber}` : ""}
        width="max-w-2xl"
      >
        {selected && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-slate-500">Status:</span>
              <Badge>{selected.status}</Badge>
            </div>
            <Banner message={detailBanner} />

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-slate-500 mb-2">Details</h3>
                <p className="text-sm mb-1"><span className="text-slate-500">Order:</span> {selected.orderId?.orderNumber || selected.orderId?._id || selected.orderId || "—"}</p>
                <p className="text-sm mb-1"><span className="text-slate-500">Partner:</span> {selected.deliveryPartnerId || "—"}</p>
                <p className="text-sm mb-1"><span className="text-slate-500">Address:</span> {selected.deliveryAddress || "—"}</p>
                <p className="text-sm mb-1"><span className="text-slate-500">Notes:</span> {selected.notes || "—"}</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-slate-500 mb-2">Timeline & location</h3>
                <p className="text-sm mb-1"><span className="text-slate-500">Created:</span> {formatDateTime(selected.createdAt)}</p>
                <p className="text-sm mb-1"><span className="text-slate-500">Assigned:</span> {formatDateTime(selected.assignedAt)}</p>
                <p className="text-sm mb-1"><span className="text-slate-500">Picked up:</span> {formatDateTime(selected.pickedUpAt)}</p>
                <p className="text-sm mb-1"><span className="text-slate-500">Delivered:</span> {formatDateTime(selected.deliveredAt)}</p>
                <p className="text-sm mb-1">
                  <span className="text-slate-500">Current location:</span>{" "}
                  {selected.currentLocation?.latitude != null
                    ? `${selected.currentLocation.latitude}, ${selected.currentLocation.longitude} (${formatDateTime(selected.currentLocation.updatedAt)})`
                    : "—"}
                </p>
              </Card>
            </div>

            {selected.status === "Pending" && (
              <Card className="p-4 mb-4">
                <h3 className="font-semibold text-sm text-slate-500 mb-2">Assign delivery partner</h3>
                <div className="flex items-end gap-2">
                  <Field label="Delivery partner ID">
                    <Input value={partnerId} onChange={(e) => setPartnerId(e.target.value)} placeholder="Partner user ID" />
                  </Field>
                  <Button loading={detailBusy} onClick={assignPartner} className="mb-3">Assign</Button>
                </div>
              </Card>
            )}

            {!isTerminal && (
              <Card className="p-4 mb-4">
                <h3 className="font-semibold text-sm text-slate-500 mb-2">Update location</h3>
                <form onSubmit={updateLocation} className="grid grid-cols-2 gap-3 items-end">
                  <Field label="Latitude">
                    <Input type="number" step="any" min="-90" max="90" value={coords.latitude} onChange={(e) => setCoords({ ...coords, latitude: e.target.value })} required />
                  </Field>
                  <Field label="Longitude">
                    <Input type="number" step="any" min="-180" max="180" value={coords.longitude} onChange={(e) => setCoords({ ...coords, longitude: e.target.value })} required />
                  </Field>
                  <div className="col-span-2">
                    <Button loading={detailBusy} type="submit">Update location</Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              {!isTerminal && (
                <Button variant="danger" disabled={detailBusy} onClick={cancelDelivery}>Cancel delivery</Button>
              )}
              {nextStatuses.filter((s) => s !== "Cancelled").map((s) => (
                <Button key={s} loading={detailBusy} onClick={() => advanceStatus(s)}>Mark as {s}</Button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
