// src/pages/inventory/StockMovements.jsx
import { useEffect, useState } from "react";
import API from "../../utils/api";

const ROWS_PER_PAGE = 10;

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMovements = async () => {
    try {
      const res = await API.get("/stock-movements");
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

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterType, dateFrom, dateTo]);

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

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (loading) return <div className="p-10 text-center text-gray-500 italic">Tracking inventory history...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Stock Movements Log</h2>

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-8 bg-gray-50 p-4 rounded-lg items-center">

        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <input
            type="text"
            placeholder="Search product or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-2 text-gray-400">✕</button>
          )}
        </div>

        {/* IN / OUT Filter Buttons */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "All", color: "bg-gray-800" },
            { key: "IN", label: "Stock IN", color: "bg-green-600" },
            { key: "OUT", label: "Stock OUT", color: "bg-red-600" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilterType(btn.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                filterType === btn.key
                  ? `${btn.color} text-white border-transparent`
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-xs font-bold uppercase">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Clear All */}
        {(search || filterType !== "all" || dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-red-500 hover:underline px-2"
          >
            Reset
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-widest font-black">
              <th className="p-4">#</th>
              <th className="p-4">Product</th>
              <th className="p-4">Type</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Notes</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-10 text-center text-gray-400 italic">
                  No stock movements found matching your filters.
                </td>
              </tr>
            ) : (
              paginated.map((move, index) => (
                <tr key={move.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-4 text-gray-300 text-xs font-bold">{startIndex + index + 1}</td>
                  <td className="p-4 font-bold text-gray-800">{move.product_name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase ${
                      move.movement_type === "IN"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {move.movement_type}
                    </span>
                  </td>
                  <td className={`p-4 font-bold ${move.movement_type === "IN" ? "text-green-600" : "text-red-600"}`}>
                    {move.movement_type === "IN" ? "+" : "-"}{move.quantity}
                  </td>
                  <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{move.notes || "—"}</td>
                  <td className="p-4 text-xs text-gray-500">
                    <div className="font-medium text-gray-700">{new Date(move.created_at).toLocaleDateString('en-GB')}</div>
                    <div className="text-[10px] text-gray-300 uppercase">{new Date(move.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {filtered.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
          <p className="text-[11px] text-gray-400 font-medium uppercase">
            Showing {startIndex + 1}–{Math.min(startIndex + ROWS_PER_PAGE, filtered.length)} of {filtered.length} movements
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                  currentPage === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}