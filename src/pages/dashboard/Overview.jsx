import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../lib/api.js";
import { Badge, Banner, Card, PageHeader, Spinner } from "../../components/ui/index.jsx";

const text = (value) => (value === null || value === undefined || value === "" ? "—" : String(value));
const money = (value) => (typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : "—");

const STAT_ICONS = {
  inventory: { path: <><rect x="3.5" y="7.5" width="17" height="13" rx="1.5" /><path d="M3.5 7.5l2-4h13l2 4" /><path d="M9 11.5h6" /></>, tone: "text-indigo-600 bg-indigo-50" },
  purchases: { path: <><path d="M6.5 7V5a2 2 0 012-2h7a2 2 0 012 2v2" /><rect x="4" y="7" width="16" height="13" rx="1.5" /></>, tone: "text-amber-600 bg-amber-50" },
  orders: { path: <><rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="M9 3.5V3a1 1 0 011-1h4a1 1 0 011 1v.5" /><path d="M9 11.5h6M9 15.5h6" /></>, tone: "text-blue-600 bg-blue-50" },
  payments: { path: <><rect x="3" y="6" width="18" height="12" rx="1.75" /><path d="M3 10h18" /><path d="M7 14h3" /></>, tone: "text-emerald-600 bg-emerald-50" },
  deliveries: { path: <><rect x="2" y="8" width="11" height="8" rx="1" /><path d="M13 11h4l3 3v2h-7z" /><circle cx="6.5" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></>, tone: "text-rose-600 bg-rose-50" },
};

function StatIcon({ name }) {
  const icon = STAT_ICONS[name];
  return (
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${icon.tone}`}>
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {icon.path}
      </svg>
    </div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiRequest("/api/chemist/dashboard")
      .then((res) => { if (!cancelled) setDashboard(res.dashboard); })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        if (/token|authentication|expired/i.test(err.message)) { localStorage.clear(); navigate("/login", { replace: true }); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [navigate]);

  if (loading) return <Spinner />;
  if (error) return <Banner message={error} />;
  if (!dashboard) return null;

  const { inventory, purchases, orders, payments, deliveries, recentOrders, recentPurchases } = dashboard;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Snapshot of your pharmacy's activity" />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="inventory" title="Inventory" headline={inventory.totalItems} headlineLabel="items tracked" rows={[
          ["Total units", inventory.totalUnits],
          ["Low stock", inventory.lowStockItems],
          ["Expiring soon", inventory.expiringMedicines],
        ]} />
        <StatCard icon="purchases" title="Purchases" headline={purchases.totalPurchases} headlineLabel="purchases made" rows={[
          ["Total value", money(purchases.totalPurchaseValue)],
        ]} />
        <StatCard icon="orders" title="Orders" headline={orders.totalOrders} headlineLabel="orders placed" rows={[
          ["Total sales", money(orders.totalSales)],
          ["Pending", orders.pending],
          ["Delivered", orders.delivered],
        ]} />
        <StatCard icon="payments" title="Payments" headline={money(payments.paidAmount)} headlineLabel="collected" rows={[
          ["Pending", money(payments.pendingAmount)],
          ["Refunded", money(payments.refundedAmount)],
          ["Failed", payments.failedPayments],
        ]} />
        <StatCard icon="deliveries" title="Deliveries" headline={deliveries.totalDeliveries} headlineLabel="total deliveries" rows={[
          ["Pending", deliveries.pending],
          ["Out for delivery", deliveries.outForDelivery],
          ["Delivered", deliveries.delivered],
        ]} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-bold mb-1">Recent orders</h2>
          <p className="text-xs text-slate-400 mb-3">Last 5 orders placed</p>
          {recentOrders?.length ? recentOrders.map((order) => (
            <div key={order._id} className="flex justify-between items-center py-2.5 border-t border-slate-100 first:border-0 text-sm">
              <span className="font-medium text-slate-700">{order.orderNumber}</span>
              <span className="text-slate-500">{money(order.grandTotal)}</span>
              <Badge>{order.status}</Badge>
            </div>
          )) : <p className="text-sm text-slate-400 text-center py-6">No orders yet.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="font-bold mb-1">Recent purchases</h2>
          <p className="text-xs text-slate-400 mb-3">Last 5 purchases recorded</p>
          {recentPurchases?.length ? recentPurchases.map((purchase) => (
            <div key={purchase._id} className="flex justify-between items-center py-2.5 border-t border-slate-100 first:border-0 text-sm">
              <span className="font-medium text-slate-700">{purchase.purchaseNumber}</span>
              <span className="text-slate-500">{money(purchase.grandTotal)}</span>
              <Badge>{purchase.status}</Badge>
            </div>
          )) : <p className="text-sm text-slate-400 text-center py-6">No purchases yet.</p>}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, title, headline, headlineLabel, rows }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <StatIcon name={icon} />
        <div className="min-w-0">
          <h2 className="font-semibold text-sm text-slate-500 truncate">{title}</h2>
          <p className="text-xl font-bold text-slate-900 leading-tight">{text(headline)}</p>
        </div>
      </div>
      {headlineLabel && <p className="text-[11px] text-slate-400 -mt-2 mb-2">{headlineLabel}</p>}
      <div className="space-y-1 pt-2 border-t border-slate-100">
        {rows.map(([label, value]) => (
          <p key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <b className="text-slate-700">{text(value)}</b>
          </p>
        ))}
      </div>
    </Card>
  );
}
