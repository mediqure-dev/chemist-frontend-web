import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, toQuery } from "../../../lib/api.js";
import {
  Badge, Banner, Modal, PageHeader, Pagination, SearchBox, Spinner, Table, useListQuery,
} from "../../../components/ui/index.jsx";

const columns = [
  { key: "name", label: "Name" },
  { key: "genericName", label: "Generic name" },
  { key: "strength", label: "Strength" },
  { key: "dosageForm", label: "Dosage form" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category" },
  {
    key: "prescriptionRequired",
    label: "Prescription",
    render: (row) => (row.prescriptionRequired ? <Badge tone="amber">Required</Badge> : <Badge tone="slate">Not required</Badge>),
  },
  { key: "status", label: "Status", render: (row) => <Badge>{row.status}</Badge> },
];

export default function Medicines() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const list = useListQuery(async ({ page, search }) => {
    const res = await apiRequest(`/api/medicines${toQuery({ page, limit: 20, q: search })}`);
    return { rows: res.data.data, totalPages: res.data.totalPages };
  });

  useEffect(() => {
    if (list.error && /token|authentication|expired/i.test(list.error)) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [list.error, navigate]);

  return (
    <div>
      <PageHeader
        title="Medicine Catalogue"
        subtitle="Managed by the platform admin — browse and search only"
      />

      <div className="mb-4">
        <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search by name, generic name, manufacturer, barcode…" />
      </div>

      {list.error && !/token|authentication|expired/i.test(list.error) && <Banner message={list.error} />}

      {list.loading ? (
        <Spinner />
      ) : (
        <>
          <Table columns={columns} rows={list.rows} onRowClick={setSelected} emptyMessage="No medicines found." />
          <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
        </>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? selected.name : ""}>
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Generic name" value={selected.genericName} />
            <Row label="Strength" value={selected.strength} />
            <Row label="Dosage form" value={selected.dosageForm} />
            <Row label="Manufacturer" value={selected.manufacturer} />
            <Row label="Category" value={selected.category} />
            <Row label="Barcode" value={selected.barcode} />
            <Row
              label="Prescription required"
              value={selected.prescriptionRequired ? <Badge tone="amber">Required</Badge> : <Badge tone="slate">Not required</Badge>}
            />
            <Row label="Status" value={<Badge>{selected.status}</Badge>} />
            <Row label="Description" value={selected.description} block />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value, block }) {
  return (
    <div className={block ? "" : "flex items-start justify-between gap-4"}>
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={block ? "block mt-1 text-slate-700" : "text-right text-slate-900"}>{value ?? "—"}</span>
    </div>
  );
}
