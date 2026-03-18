// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell
} from "recharts";

//const BASE = "http://localhost:5003/api/dashboard";
const BLUE_SHADES = ["#1e3a5f", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"];

function StatCard({ label, value, sub, icon, bg }) {
  return (
    <div style={{
      background: bg, borderRadius: 14, padding: "24px 28px",
      boxShadow: "0 4px 20px rgba(30,58,138,0.13)",
      display: "flex", alignItems: "center", gap: 20, flex: 1, minWidth: 200,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "rgba(255,255,255,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
        <p style={{ margin: "6px 0 2px", fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
  try {
    const [sumRes, topRes] = await Promise.all([
      API.get("/dashboard/summary"),      // Just use the endpoint name
      API.get("/dashboard/top-products"), // Just use the endpoint name
    ]);
      setSummary(sumRes.data);
      setTopProducts(topRes.data.map((p) => ({
        ...p,
        product_name: p.size && p.size !== "N/A"
          ? `${p.product_name} (${p.size})`
          : p.product_name,
      })));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", background: "#f0f4ff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏥</div>
          <p style={{ color: "#2563eb", fontSize: 16, fontWeight: 600 }}>Loading Famcare POS...</p>
        </div>
      </div>
    );
  }

  const { today, stock_movement, alerts } = summary || {};
  const totalAlerts = (alerts?.low_stock?.length || 0) +
    (alerts?.expired?.length || 0) +
    (alerts?.expiring_soon?.length || 0);

  return (
    <div style={{ background: "#f0f4ff", minHeight: "100vh", padding: "28px 32px" }}>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        borderRadius: 16, padding: "24px 32px", marginBottom: 28,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 8px 32px rgba(30,58,138,0.25)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 32 }}>🏥</span>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#fff" }}>Famcare POS</h1>
          </div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
            {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/sales/new" style={{
            background: "#fff", color: "#2563eb", borderRadius: 10,
            padding: "10px 20px", fontSize: 14, fontWeight: 700,
            textDecoration: "none",
          }}>+ New Sale</Link>
          <Link to="/purchases/new" style={{
            background: "rgba(255,255,255,0.18)", color: "#fff", borderRadius: 10,
            padding: "10px 20px", fontSize: 14, fontWeight: 700,
            textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.4)",
          }}>+ New Purchase</Link>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Sales Today" value={today?.total_sales || 0} sub="transactions" icon="🧾" bg="linear-gradient(135deg, #1d4ed8, #3b82f6)" />
        <StatCard label="Revenue Today" value={`KES ${(today?.revenue || 0).toLocaleString()}`} sub="total collected" icon="💰" bg="linear-gradient(135deg, #1e3a5f, #2563eb)" />
        <StatCard label="Purchases Today" value={today?.total_purchases || 0} sub={`KES ${(today?.purchase_amount || 0).toLocaleString()} spent`} icon="🛒" bg="linear-gradient(135deg, #1e40af, #60a5fa)" />
        <StatCard label="Stock Movement" value={`+${stock_movement?.stock_in || 0}`} sub={`−${stock_movement?.stock_out || 0} units out`} icon="📦" bg="linear-gradient(135deg, #1d4ed8, #93c5fd)" />
      </div>

      {/* ALERTS */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: "24px 28px",
        marginBottom: 28, boxShadow: "0 4px 20px rgba(30,58,138,0.08)",
        borderTop: "4px solid #2563eb",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e3a5f" }}>Alerts & Warnings</h2>
          {totalAlerts > 0 && (
            <span style={{ background: "#ef4444", color: "#fff", borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 700 }}>
              {totalAlerts}
            </span>
          )}
        </div>

        {totalAlerts === 0 ? (
          <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>✅</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#16a34a", fontSize: 15 }}>All Clear!</p>
              <p style={{ margin: 0, color: "#86efac", fontSize: 13 }}>No expired products, no low stock issues.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {alerts?.expired?.length > 0 && (
              <div style={{ background: "#fef2f2", borderRadius: 10, padding: 16, border: "1px solid #fecaca" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#ef4444", fontSize: 13, textTransform: "uppercase" }}>❌ Expired Products — Remove from stock immediately</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {alerts.expired.map((p) => (
                    <div key={p.id} style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 700, color: "#1e3a5f", fontSize: 14 }}>{p.name}{p.size && p.size !== "N/A" ? ` — ${p.size}` : ""}</span>
                      <span style={{ background: "#ef4444", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                        Expired {new Date(p.expiry_date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts?.expiring_soon?.length > 0 && (
              <div style={{ background: "#fffbeb", borderRadius: 10, padding: 16, border: "1px solid #fde68a" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#d97706", fontSize: 13, textTransform: "uppercase" }}>🕐 Expiring Within 30 Days</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {alerts.expiring_soon.map((p) => (
                    <div key={p.id} style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 700, color: "#1e3a5f", fontSize: 14 }}>{p.name}{p.size && p.size !== "N/A" ? ` — ${p.size}` : ""}</span>
                      <span style={{ background: "#f59e0b", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{p.days_left} days left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts?.low_stock?.length > 0 && (
              <div style={{ background: "#eff6ff", borderRadius: 10, padding: 16, border: "1px solid #bfdbfe" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#2563eb", fontSize: 13, textTransform: "uppercase" }}>📉 Low Stock — Less than 5 units</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {alerts.low_stock.map((p) => (
                    <div key={p.id} style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 700, color: "#1e3a5f", fontSize: 14 }}>{p.name}{p.size && p.size !== "N/A" ? ` — ${p.size}` : ""}</span>
                      <span style={{ background: "#2563eb", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{p.quantity} left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TOP SELLING PRODUCTS */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: "24px 28px",
        boxShadow: "0 4px 20px rgba(30,58,138,0.08)",
        borderTop: "4px solid #2563eb",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🏆</span>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e3a5f" }}>Top Selling Products</h2>
        </div>
        {topProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#93c5fd" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
            <p style={{ margin: 0, fontSize: 14 }}>No sales data yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e9ff" />
              <XAxis dataKey="product_name" tick={{ fontSize: 12, fill: "#1e3a5f", fontWeight: 600 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(30,58,138,0.15)" }} formatter={(val) => [`${val} units`, "Units Sold"]} />
              <Bar dataKey="total_sold" radius={[8, 8, 0, 0]} name="Units Sold">
                {topProducts.map((_, i) => (
                  <Cell key={i} fill={BLUE_SHADES[i % BLUE_SHADES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}