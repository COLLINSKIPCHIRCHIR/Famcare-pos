import { useEffect, useState } from "react";
import axios from "axios";

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchMovements = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/stock-movements");
      setMovements(res.data);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  // Filter by search, type and date range
  const filtered = movements.filter((move) => {
    const q = search.toLowerCase();
    const matchesSearch =
      move.product_name?.toLowerCase().includes(q) ||
      move.notes?.toLowerCase().includes(q);

    const matchesType =
      filterType === "all" || move.movement_type === filterType;

    const moveDate = new Date(move.created_at);
    const matchesFrom = dateFrom ? moveDate >= new Date(dateFrom) : true;
    const matchesTo = dateTo ? moveDate <= new Date(dateTo + "T23:59:59") : true;

    return matchesSearch && matchesType && matchesFrom && matchesTo;
  });

  const clearFilters = () => {
    setSearch("");
    setFilterType("all");
    setDateFrom("");
    setDateTo("");
  };

  if (loading) return <p>Loading stock movements...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Stock Movements</h2>

      {/* Search and Filter Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "16px 0" }}>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="text"
            placeholder="Search by product or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "1px solid #ddd", padding: "8px 12px", borderRadius: 6, width: 240, fontSize: 14 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* IN / OUT Filter Buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "all", label: "All" },
            { key: "IN", label: "Stock IN" },
            { key: "OUT", label: "Stock OUT" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilterType(btn.key)}
              style={{
                padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid",
                background: filterType === btn.key
                  ? btn.key === "IN" ? "#16a34a" : btn.key === "OUT" ? "#ef4444" : "#2563eb"
                  : "#fff",
                color: filterType === btn.key ? "#fff" : "#555",
                borderColor: filterType === btn.key
                  ? btn.key === "IN" ? "#16a34a" : btn.key === "OUT" ? "#ef4444" : "#2563eb"
                  : "#ddd",
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
        {(search || filterType !== "all" || dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            style={{ background: "#f4f4f4", border: "1px solid #ddd", borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer", color: "#555" }}
          >
            ✕ Clear All
          </button>
        )}
      </div>

      <table
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
        style={{ borderCollapse: "collapse", marginTop: "10px" }}
      >
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Movement Type</th>
            <th>Quantity</th>
            <th>Notes</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="6" align="center">
                No stock movements found
              </td>
            </tr>
          ) : (
            filtered.map((move, index) => (
              <tr key={move.id}>
                <td>{index + 1}</td>
                <td>{move.product_name}</td>
                <td>
                  <span style={{
                    background: move.movement_type === "IN" ? "#dcfce7" : "#fee2e2",
                    color: move.movement_type === "IN" ? "#16a34a" : "#ef4444",
                    padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700
                  }}>
                    {move.movement_type}
                  </span>
                </td>
                <td>{move.quantity}</td>
                <td>{move.notes}</td>
                <td>{new Date(move.created_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {movements.length > 0 && (
        <p style={{ fontSize: 13, color: "#aaa", marginTop: 10 }}>
          Showing {filtered.length} of {movements.length} movements
        </p>
      )}
    </div>
  );
}