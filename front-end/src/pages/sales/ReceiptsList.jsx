// src/pages/sales/ReceiptsList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ReceiptsList() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/receipts")
      .then((res) => setReceipts(res.data))
      .catch((err) => console.error("Error fetching receipts:", err))
      .finally(() => setLoading(false));
  }, []);

  // Filter receipts
  const filtered = receipts.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.customer_name?.toLowerCase().includes(q) ||
      String(r.id).padStart(5, "0").includes(q);

    const matchesPayment =
      filterPayment === "all" || r.payment_method === filterPayment;

    const rDate = new Date(r.created_at);
    const matchesFrom = dateFrom ? rDate >= new Date(dateFrom) : true;
    const matchesTo = dateTo ? rDate <= new Date(dateTo + "T23:59:59") : true;

    return matchesSearch && matchesPayment && matchesFrom && matchesTo;
  });

  const clearFilters = () => {
    setSearch("");
    setFilterPayment("all");
    setDateFrom("");
    setDateTo("");
  };

  if (loading) return <p className="p-6 text-center text-gray-500">Loading receipts...</p>;

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Receipts</h2>

      {/* Search and Filter Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="text"
            placeholder="Search by customer or receipt no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 6, width: 250, fontSize: 14 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Payment Method Filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "cash", "mpesa", "card"].map((method) => (
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

      {receipts.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No receipts found.</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No receipts match your search or filter.</p>
      ) : (
        <>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-left">
                <th className="p-3 border">Receipt #</th>
                <th className="p-3 border">Customer</th>
                <th className="p-3 border">Amount (KES)</th>
                <th className="p-3 border">Payment Method</th>
                <th className="p-3 border">Date</th>
                <th className="p-3 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 border font-medium text-blue-600">#{String(r.id).padStart(5, "0")}</td>
                  <td className="p-3 border">{r.customer_name || "Walk-in"}</td>
                  <td className="p-3 border font-semibold">KES {Number(r.total_amount).toLocaleString()}</td>
                  <td className="p-3 border">
                    <span style={{
                      background: r.payment_method === "cash" ? "#dcfce7" : r.payment_method === "mpesa" ? "#d1fae5" : "#dbeafe",
                      color: r.payment_method === "cash" ? "#16a34a" : r.payment_method === "mpesa" ? "#059669" : "#2563eb",
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "capitalize",
                    }}>
                      {r.payment_method}
                    </span>
                  </td>
                  <td className="p-3 border">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3 border text-center">
                    <button
                      onClick={() => navigate(`/sales/receipts/${r.id}`)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: "#aaa", marginTop: 10 }}>
            Showing {filtered.length} of {receipts.length} receipts
          </p>
        </>
      )}
    </div>
  );
}