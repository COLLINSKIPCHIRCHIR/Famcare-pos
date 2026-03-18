// src/pages/sales/ReceiptsList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const ROWS_PER_PAGE = 10;

export default function ReceiptsList() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/receipts")
      .then((res) => setReceipts(res.data))
      .catch((err) => console.error("Error fetching receipts:", err))
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterPayment, dateFrom, dateTo]);

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

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (loading) return <p className="p-6 text-center text-gray-500">Loading receipts...</p>;

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Receipts History</h2>
        <button
          onClick={() => navigate("/sales/new")}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-green-700"
        >
          + New Sale
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-gray-50 w-full md:w-64">
          <input
            type="text"
            placeholder="Search customer or #no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>

        <div className="flex gap-2">
          {["all", "cash", "mpesa", "card"].map((method) => (
            <button
              key={method}
              onClick={() => setFilterPayment(method)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors border uppercase ${
                filterPayment === method
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {method === "all" ? "All" : method}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border p-2 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border p-2 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {(search || filterPayment !== "all" || dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-red-500 hover:underline px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {receipts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-lg">
          <p className="text-gray-400">No receipts found in the system.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No receipts match your search criteria.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4 border-b">Receipt #</th>
                <th className="p-4 border-b">Customer</th>
                <th className="p-4 border-b">Amount</th>
                <th className="p-4 border-b">Method</th>
                <th className="p-4 border-b">Date</th>
                <th className="p-4 border-b text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-mono text-blue-600 font-bold">
                    #{String(r.id).padStart(5, "0")}
                  </td>
                  <td className="p-4 font-medium text-gray-700">
                    {r.customer_name || "Walk-in Customer"}
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    KES {Number(r.total_amount).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      r.payment_method === "cash" ? "bg-green-100 text-green-700" :
                      r.payment_method === "mpesa" ? "bg-emerald-100 text-emerald-800" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {r.payment_method}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 italic text-xs">
                    {new Date(r.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => navigate(`/sales/receipts/${r.id}`)}
                      className="bg-gray-800 text-white px-4 py-1.5 rounded-md hover:bg-black transition-all text-xs font-bold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Bar */}
          <div className="mt-4 flex justify-between items-center text-xs text-gray-400 px-2">
            <p>Showing <strong>{startIndex + 1}–{Math.min(startIndex + ROWS_PER_PAGE, filtered.length)}</strong> of <strong>{filtered.length}</strong> total records</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md border font-bold transition ${
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
                className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}