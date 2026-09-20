import { NavLink, Outlet, useNavigate } from "react-router-dom";

const ICONS = {
  dashboard: <><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></>,
  medicine: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>,
  inventory: <><rect x="3.5" y="7.5" width="17" height="13" rx="1.5" /><path d="M3.5 7.5l2-4h13l2 4" /><path d="M9 11.5h6" /></>,
  suppliers: <><path d="M4 21V9l8-5 8 5v12" /><path d="M9 21v-6h6v6" /></>,
  purchases: <><path d="M6.5 7V5a2 2 0 012-2h7a2 2 0 012 2v2" /><rect x="4" y="7" width="16" height="13" rx="1.5" /></>,
  orders: <><rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="M9 3.5V3a1 1 0 011-1h4a1 1 0 011 1v.5" /><path d="M9 11.5h6M9 15.5h6" /></>,
  payments: <><rect x="3" y="6" width="18" height="12" rx="1.75" /><path d="M3 10h18" /><path d="M7 14h3" /></>,
  deliveries: <><rect x="2" y="8" width="11" height="8" rx="1" /><path d="M13 11h4l3 3v2h-7z" /><circle cx="6.5" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></>,
  pos: <><circle cx="9" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /><path d="M3 4h2l2.2 11h10.4L20 8H6.4" /></>,
  invoices: <><rect x="6" y="3" width="12" height="18" rx="1.5" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  prescriptions: <><rect x="6" y="3" width="12" height="18" rx="1.5" /><path d="M9 8h6M9 12h4" /><path d="M9 16l1.5 1.5L14 14" /></>,
  quotations: <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />,
  notifications: <><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0112 0v1" /></>,
};

function NavIcon({ name, className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [["", "Dashboard", "dashboard"]],
  },
  {
    label: "Catalogue & Stock",
    items: [
      ["medicines", "Medicine Catalogue", "medicine"],
      ["inventory", "Inventory", "inventory"],
      ["suppliers", "Suppliers", "suppliers"],
    ],
  },
  {
    label: "Procurement",
    items: [["purchases", "Purchases", "purchases"]],
  },
  {
    label: "Sales & Fulfillment",
    items: [
      ["orders", "Orders", "orders"],
      ["payments", "Payments", "payments"],
      ["deliveries", "Deliveries", "deliveries"],
    ],
  },
  {
    label: "Billing",
    items: [
      ["pos", "POS Sales", "pos"],
      ["invoices", "Invoices", "invoices"],
    ],
  },
  {
    label: "Prescriptions",
    items: [
      ["prescriptions", "Prescriptions", "prescriptions"],
      ["quotations", "Quotations", "quotations"],
    ],
  },
  {
    label: "Communication",
    items: [["notifications", "Notifications", "notifications"]],
  },
  {
    label: "Account",
    items: [["profile", "Profile & Settings", "profile"]],
  },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const account = JSON.parse(localStorage.getItem("chemist_account") || "{}");
  const initial = (account.shopName || "M").trim().charAt(0).toUpperCase();

  function signOut() {
    localStorage.clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 px-5 py-4 text-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300">
            {initial}
          </div>
          <div>
            <b className="tracking-tight">MediQure Chemist</b>
            <p className="text-xs text-slate-400">{account.shopName || "Pharmacy workspace"}</p>
          </div>
        </div>
        <button onClick={signOut} className="text-sm text-slate-300 hover:text-white transition-colors">Sign out</button>
      </header>
      <div className="max-w-7xl mx-auto p-4 grid gap-4 lg:grid-cols-[230px_1fr]">
        <aside className="bg-white rounded-xl p-3 h-fit lg:sticky lg:top-4 space-y-4 border border-slate-200/80 shadow-sm shadow-slate-200/50">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{section.label}</p>
              {section.items.map(([path, label, icon]) => (
                <NavLink
                  key={path}
                  to={path ? `/dashboard/${path}` : "/dashboard"}
                  end={path === ""}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-lg text-sm border-l-2 transition-colors ${
                      isActive
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                    }`
                  }
                >
                  <NavIcon name={icon} className="h-4.5 w-4.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </aside>
        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
