import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Button, Field, Input, Modal, PageHeader,
  Pagination, SearchBox, Spinner, Table, Textarea, useListQuery,
} from "../../../components/ui/index.jsx";

const emptyForm = {
  name: "", companyName: "", phone: "", email: "", gstNumber: "", licenseNumber: "", notes: "",
  address: { street: "", city: "", state: "", pincode: "" },
};

const columns = [
  { key: "name", label: "Name" },
  { key: "companyName", label: "Company" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "gstNumber", label: "GST Number" },
  { key: "status", label: "Status", render: (row) => <Badge>{row.status}</Badge> },
];

export default function Suppliers() {
  const navigate = useNavigate();
  const list = useListQuery(async ({ page, search }) => {
    const res = await apiRequest(`/api/chemist/suppliers${toQuery({ page, limit: 20, search })}`);
    return { rows: res.data.data, totalPages: res.data.totalPages };
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createBanner, setCreateBanner] = useState("");
  const [creating, setCreating] = useState(false);

  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editBanner, setEditBanner] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (list.error && /token|authentication|expired/i.test(list.error)) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [list.error, navigate]);

  function openCreate() {
    setCreateForm(emptyForm);
    setCreateBanner("");
    setCreateOpen(true);
  }

  async function submitCreate(e) {
    e.preventDefault();
    setCreating(true); setCreateBanner("");
    try {
      await apiRequest("/api/chemist/suppliers", { method: "POST", body: createForm });
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
    setEditForm({
      name: row.name || "",
      companyName: row.companyName || "",
      phone: row.phone || "",
      email: row.email || "",
      gstNumber: row.gstNumber || "",
      licenseNumber: row.licenseNumber || "",
      notes: row.notes || "",
      address: {
        street: row.address?.street || "",
        city: row.address?.city || "",
        state: row.address?.state || "",
        pincode: row.address?.pincode || "",
      },
    });
    setEditBanner("");
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true); setEditBanner("");
    try {
      await apiRequest(`/api/chemist/suppliers/${selected._id}`, { method: "PUT", body: editForm });
      list.reload();
      setSelected(null);
    } catch (err) {
      setEditBanner(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    if (!window.confirm("Deactivate this supplier? This cannot be undone from here.")) return;
    setSaving(true); setEditBanner("");
    try {
      await apiRequest(`/api/chemist/suppliers/${selected._id}`, { method: "DELETE" });
      setSelected(null);
      list.reload();
    } catch (err) {
      setEditBanner(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Manage the vendors you purchase medicines from"
        action={<Button onClick={openCreate}>Add supplier</Button>}
      />

      <div className="mb-4">
        <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search by name, company, phone, email, GST…" />
      </div>

      {list.error && !/token|authentication|expired/i.test(list.error) && <Banner message={list.error} />}

      {list.loading ? (
        <Spinner />
      ) : (
        <>
          <Table columns={columns} rows={list.rows} onRowClick={openDetail} emptyMessage="No suppliers yet. Add your first supplier to get started." />
          <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
        </>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add supplier"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={creating} onClick={submitCreate}>Save supplier</Button>
          </>
        }
      >
        <Banner message={createBanner} />
        <SupplierFormFields form={createForm} setForm={setCreateForm} />
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Supplier — ${selected.name}` : ""}
        footer={
          selected && (
            <>
              <Button variant="danger" onClick={deactivate} disabled={saving || selected.status === "Inactive"}>
                Deactivate
              </Button>
              <Button loading={saving} onClick={submitEdit}>Save changes</Button>
            </>
          )
        }
      >
        {selected && editForm && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-slate-500">Status:</span>
              <Badge>{selected.status}</Badge>
            </div>
            <Banner message={editBanner} />
            <SupplierFormFields form={editForm} setForm={setEditForm} />
          </>
        )}
      </Modal>
    </div>
  );
}

function SupplierFormFields({ form, setForm }) {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Field label="Name *">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      <Field label="Company name">
        <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone" hint="7-20 digits, may include + - ( ) and spaces">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" />
        </Field>
        <Field label="Email">
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="GST number">
          <Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
        </Field>
        <Field label="License number">
          <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Street">
          <Input value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
        </Field>
        <Field label="City">
          <Input value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="State">
          <Input value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
        </Field>
        <Field label="Pincode">
          <Input value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </form>
  );
}
