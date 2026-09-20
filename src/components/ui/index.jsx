/* eslint-disable react-refresh/only-export-components -- intentional: this is a shared kit file mixing components with the helpers/hooks they're used alongside, not a component meant for Fast Refresh isolation. */
import { useEffect, useState } from "react";

/* Shared UI kit for the chemist dashboard. Keep styling consistent with the
   indigo/slate look already used on Login/Register: rounded-xl, slate-100
   background, white cards, indigo-600 accents. */

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="font-bold text-xl text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Card({ className = "", children }) {
  return <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-200/50 ${className}`}>{children}</div>;
}

const buttonVariants = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 focus-visible:ring-indigo-500",
  secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus-visible:ring-slate-400",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20 focus-visible:ring-red-500",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-400",
};

function MiniSpinner({ className = "text-current" }) {
  return (
    <svg className={`animate-spin h-3.5 w-3.5 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function Button({ variant = "primary", size = "md", loading, disabled, className = "", children, ...props }) {
  const sizeCls = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${sizeCls} ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {loading && <MiniSpinner />}
      {loading ? "Working…" : children}
    </button>
  );
}

const badgeTones = {
  slate: "bg-slate-100 text-slate-600",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  indigo: "bg-indigo-50 text-indigo-700",
  blue: "bg-blue-50 text-blue-700",
};

const badgeDots = {
  slate: "bg-slate-400",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  indigo: "bg-indigo-500",
  blue: "bg-blue-500",
};

/** Status → tone mapping shared across modules so the same word always renders the same color. */
export const STATUS_TONES = {
  Pending: "amber", Draft: "slate", Ordered: "blue", "Partially Received": "amber",
  Received: "green", Cancelled: "red", Confirmed: "blue", Preparing: "amber",
  Ready: "indigo", "Out for Delivery": "indigo", Delivered: "green", Paid: "green",
  Failed: "red", Refunded: "slate", Assigned: "blue", "Picked Up": "indigo",
  Active: "green", Inactive: "slate", Approved: "green", Rejected: "red",
  "Under Review": "amber", Archived: "slate", Sent: "blue", Accepted: "green",
  Converted: "indigo", Expired: "slate", sent: "green", pending: "amber", failed: "red",
};

export function Badge({ tone, children }) {
  const resolved = tone || STATUS_TONES[children] || "slate";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeTones[resolved]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${badgeDots[resolved]}`} />
      {children}
    </span>
  );
}

export function Table({ columns, rows, rowKey = "_id", emptyMessage = "No records found.", onRowClick }) {
  if (!rows?.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap border-b border-slate-200">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              className={`group ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5 align-top border-b border-slate-100 group-hover:bg-slate-50/80 transition-colors">
                  {col.render ? col.render(row) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-slate-500">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, width = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-[mq-fade-in_150ms_ease-out]" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full ${width} max-h-[90vh] overflow-y-auto animate-[mq-scale-in_150ms_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block mb-3">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}

const inputCls = "w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white placeholder:text-slate-400";

export function Input(props) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function Textarea(props) {
  return <textarea {...props} className={`${inputCls} h-auto py-2 ${props.className || ""}`} />;
}

export function Select({ children, ...props }) {
  return <select {...props} className={`${inputCls} ${props.className || ""}`}>{children}</select>;
}

export function SearchBox({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative max-w-xs w-full">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" strokeLinecap="round" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
      <Input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12">
      <div className="h-6 w-6 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      <span className="text-xs text-slate-400">Loading…</span>
    </div>
  );
}

export function EmptyState({ message = "Nothing here yet." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <svg className="h-9 w-9 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l1.5-3h15L21 7M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7M3 7h18M9 11h6" />
      </svg>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

const bannerStyles = {
  error: { cls: "bg-red-50 text-red-700 border-red-100", icon: "M12 9v4m0 4h.01M10.29 3.86l-8.18 14.14A1.5 1.5 0 003.5 20.5h17a1.5 1.5 0 001.39-2.5L13.71 3.86a1.5 1.5 0 00-2.42 0z" },
  success: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: "M5 13l4 4L19 7" },
  info: { cls: "bg-blue-50 text-blue-700 border-blue-100", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
};

export function Banner({ type = "error", message }) {
  if (!message) return null;
  const style = bannerStyles[type];
  return (
    <div className={`flex items-start gap-2 p-3 mb-4 rounded-lg text-sm border ${style.cls}`}>
      <svg className="h-4 w-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export function formatMoney(value) {
  return typeof value === "number" ? `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—";
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Lightweight fetch-list hook: handles page/search state, loading, and refetching. */
export function useListQuery(fetcher, deps = []) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [state, setState] = useState({ loading: true, error: "", rows: [], totalPages: 1 });
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fetcher({ page, search })
      .then((result) => { if (!cancelled) setState({ loading: false, error: "", ...result }); })
      .catch((err) => { if (!cancelled) setState((s) => ({ ...s, loading: false, error: err.message })); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, reloadTick, ...deps]);

  useEffect(() => { setPage(1); }, [search]);

  return { ...state, page, setPage, search, setSearch, reload: () => setReloadTick((t) => t + 1) };
}
