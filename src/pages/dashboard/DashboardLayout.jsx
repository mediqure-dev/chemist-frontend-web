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
  signout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
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
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row">
      <aside className="lg:w-64 lg:shrink-0 lg:h-screen lg:sticky lg:top-0 bg-slate-950 flex flex-col shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="h-9 w-9 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300 shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <b className="text-white tracking-tight block truncate">MediQure Chemist</b>
            <p className="text-xs text-slate-400 truncate">{account.shopName || "Pharmacy workspace"}</p>
          </div>
        </div>
        <nav className="lg:flex-1 lg:overflow-y-auto p-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{section.label}</p>
              {section.items.map(([path, label, icon]) => (
                <NavLink
                  key={path}
                  to={path ? `/dashboard/${path}` : "/dashboard"}
                  end={path === ""}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-lg text-sm border-l-2 transition-colors ${
                      isActive
                        ? "border-indigo-400 bg-indigo-500/15 text-indigo-300 font-medium"
                        : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    }`
                  }
                >
                  <NavIcon name={icon} className="h-4.5 w-4.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors"
          >
            <NavIcon name="signout" className="h-4.5 w-4.5 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <main className="max-w-6xl mx-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
