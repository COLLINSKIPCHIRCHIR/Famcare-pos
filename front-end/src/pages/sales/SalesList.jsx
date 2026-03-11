// src/pages/sales/SalesList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await axios.get("http://localhost:5003/api/sales/list");
        setSales(res.data);
      } catch (err) {
        setError("Failed to load sales.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // Filter sales
  const filtered = sales.filter((sale) => {
    const q = search.toLowerCase();
    const matchesSearch =
      sale.customer_name?.toLowerCase().includes(q) ||
      sale.invoice_number?.toLowerCase().includes(q);

    const matchesPayment =
      filterPayment === "all" || sale.payment_method === filterPayment;

    const saleDate = new Date(sale.created_at);
    const matchesFrom = dateFrom ? saleDate >= new Date(dateFrom) : true;
    const matchesTo = dateTo ? saleDate <= new Date(dateTo + "T23:59:59") : true;

    return matchesSearch && matchesPayment && matchesFrom && matchesTo;
  });

  const clearFilters = () => {
    setSearch("");
    setFilterPayment("all");
    setDateFrom("");
    setDateTo("");
  };

  const paymentBadgeColor = (method) => {
    switch (method) {
      case "cash": return { background: "#dcfce7", color: "#16a34a" };
      case "mpesa": return { background: "#d1fae5", color: "#059669" };
      case "card": return { background: "#dbeafe", color: "#2563eb" };
      case "insurance": return { background: "#ede9fe", color: "#7c3aed" };
      case "credit": return { background: "#fee2e2", color: "#ef4444" };
      default: return { background: "#f3f4f6", color: "#6b7280" };
    }
  };

  if (loading) return <div className="p-6">Loading sales...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Sales List</h2>

      {/* Search and Filter Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="text"
            placeholder="Search by customer or invoice no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 6, width: 260, fontSize: 14 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Payment Method Filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "cash", "mpesa", "card", "insurance", "credit"].map((method) => (
            <button
              key={method}
              onClick={() => setFilterPayment(method)}
              style={{
                padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "1px solid",
                background: filterPayment === method ? "#2563eb" : "#fff",
                color: filterPayment === method ? "#fff" : "#555",
                borderColor: filterPayment === method ? "#2563eb" : "#ddd",
                textTransform: "capitalize",
              }}
            >
              {method === "all" ? "All Methods" : method}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ border: "1px solid #ddd", padding: "8px 10px", borderRadius: 6, fontSize: 13 }}
          />
          <span style={{ color: "#aaa", fontSize: 13 }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ border: "1px solid #ddd", padding: "8px 10px", borderRadius: 6, fontSize: 13 }}
          />
        </div>

        {/* Clear All */}
        {(search || filterPayment !== "all" || dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            style={{ background: "#f4f4f4", border: "1px solid #ddd", borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer", color: "#555" }}
          >
            ✕ Clear All
          </button>
        )}
      </div>

      {sales.length === 0 ? (
        <p className="text-gray-500">No sales recorded yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No sales match your search or filter.</p>
      ) : (
        <>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-3 border">#</th>
                <th className="p-3 border">Invoice No</th>
                <th className="p-3 border">Customer Name</th>
                <th className="p-3 border">Total (KES)</th>
                <th className="p-3 border">Payment Method</th>
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale, index) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="p-3 border">{index + 1}</td>
                  <td className="p-3 border font-medium text-blue-600">
                    {sale.invoice_number || `#${sale.id}`}
                  </td>
                  <td className="p-3 border">{sale.customer_name || "—"}</td>
                  <td className="p-3 border font-semibold">
                    KES {Number(sale.total_amount).toLocaleString()}
                  </td>
                  <td className="p-3 border">
                    <span style={{
                      ...paymentBadgeColor(sale.payment_method),
                      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    }}>
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="p-3 border">
                    {new Date(sale.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 border">
                    <button
                      onClick={() => navigate(`/sales/invoice/${sale.id}`)}
                      style={{
                        background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
                        borderRadius: 6, padding: "5px 12px", fontSize: 12,
                        fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      👁 View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: "#aaa", marginTop: 10 }}>
            Showing {filtered.length} of {sales.length} sales
          </p>
        </>
      )}
    </div>
  );
}