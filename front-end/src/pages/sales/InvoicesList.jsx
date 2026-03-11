// src/pages/sales/InvoicesList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get("http://localhost:5003/api/sales/list");
        setInvoices(res.data);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };
    fetchInvoices();
  }, []);

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch =
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.invoice_number?.toLowerCase().includes(q);

    const isPending = inv.payment_method === "credit" || inv.payment_method === "insurance";
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "paid" && !isPending) ||
      (filterStatus === "pending" && isPending);

    const invDate = new Date(inv.created_at);
    const matchesFrom = dateFrom ? invDate >= new Date(dateFrom) : true;
    const matchesTo = dateTo ? invDate <= new Date(dateTo + "T23:59:59") : true;

    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Invoices</h2>

      {/* Search and Filter Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="text"
            placeholder="Search by customer or invoice no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 6, width: 250, fontSize: 14 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "all", label: "All" },
            { key: "paid", label: "✅ Paid" },
            { key: "pending", label: "🕐 Pending" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilterStatus(btn.key)}
              style={{
                padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "1px solid",
                background: filterStatus === btn.key ? "#2563eb" : "#fff",
                color: filterStatus === btn.key ? "#fff" : "#555",
                borderColor: filterStatus === btn.key ? "#2563eb" : "#ddd",
              }}
            >
              {btn.label}
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
        {(search || filterStatus !== "all" || dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            style={{ background: "#f4f4f4", border: "1px solid #ddd", borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer", color: "#555" }}
          >
            ✕ Clear All
          </button>
        )}
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="p-3 text-left border">#</th>
            <th className="p-3 text-left border">Invoice No</th>
            <th className="p-3 text-left border">Customer</th>
            <th className="p-3 text-left border">Total (KES)</th>
            <th className="p-3 text-left border">Date</th>
            <th className="p-3 text-left border">Status</th>
            <th className="p-3 text-center border">Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-400">
                No invoices match your search or filter.
              </td>
            </tr>
          ) : (
            filtered.map((inv, index) => {
              const isPending = inv.payment_method === "credit" || inv.payment_method === "insurance";
              return (
                <tr key={inv.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 border">{index + 1}</td>
                  <td className="p-3 border font-medium text-blue-600">
                    {inv.invoice_number || `#${inv.id}`}
                  </td>
                  <td className="p-3 border">{inv.customer_name || "—"}</td>
                  <td className="p-3 border font-semibold">
                    KES {Number(inv.total_amount).toLocaleString()}
                  </td>
                  <td className="p-3 border">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="p-3 border">
                    <span style={{
                      background: isPending ? "#fef9c3" : "#dcfce7",
                      color: isPending ? "#b45309" : "#16a34a",
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    }}>
                      {isPending ? "🕐 Pending" : "✅ Paid"}
                    </span>
                  </td>
                  <td className="p-3 border text-center">
                    <button
                      onClick={() => navigate(`/sales/invoice/${inv.id}`)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {invoices.length > 0 && (
        <p style={{ fontSize: 13, color: "#aaa", marginTop: 10 }}>
          Showing {filtered.length} of {invoices.length} invoices
        </p>
      )}
    </div>
  );
}