// src/pages/sales/SalesList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const ROWS_PER_PAGE = 10;

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await API.get("/sales/list");
        setSales(res.data);
      } catch (err) {
        setError("Failed to load sales records.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterPayment, dateFrom, dateTo]);

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

  const getPaymentBadgeClass = (method) => {
    switch (method) {
      case "cash": return "bg-green-100 text-green-700";
      case "mpesa": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "card": return "bg-blue-100 text-blue-700";
      case "insurance": return "bg-purple-100 text-purple-700";
      case "credit": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (loading) return <div className="p-10 text-center text-gray-500 font-medium">Loading sales records...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sales Records</h2>
        <button
          onClick={() => navigate("/sales/new")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
        >
          + Create New Invoice
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-8 bg-gray-50 p-4 rounded-lg items-center">
        <div className="relative flex-1 min-w-[280px]">
          <input
            type="text"
            placeholder="Search customer or invoice no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-2 text-gray-400">✕</button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 p-2 rounded-lg text-xs"
          />
          <span className="text-gray-400 text-xs font-bold">TO</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 p-2 rounded-lg text-xs"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {["all", "cash", "mpesa", "card", "insurance", "credit"].map((method) => (
            <button
              key={method}
              onClick={() => setFilterPayment(method)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${
                filterPayment === method
                  ? "bg-gray-800 border-gray-800 text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:border-blue-400"
              }`}
            >
              {method}
            </button>
          ))}
        </div>

        {(search || filterPayment !== "all" || dateFrom || dateTo) && (
          <button onClick={clearFilters} className="text-xs text-red-500 font-bold hover:underline">
            Reset Filters
          </button>
        )}
      </div>

      {sales.length === 0 ? (
        <div className="text-center py-20 text-gray-400 italic">No sales have been recorded yet.</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No sales match your current search criteria.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-widest font-black">
                  <th className="p-4">#</th>
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4 text-center">Payment</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((sale, index) => (
                  <tr key={sale.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="p-4 text-gray-300 text-xs font-bold">{startIndex + index + 1}</td>
                    <td className="p-4 font-mono font-bold text-blue-600">
                      {sale.invoice_number || `FCR/${sale.id}/2026`}
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      {sale.customer_name || "Guest Customer"}
                    </td>
                    <td className="p-4 font-black text-gray-900">
                      KES {Number(sale.total_amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getPaymentBadgeClass(sale.payment_method)}`}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString('en-GB')} <br/>
                      <span className="text-[10px] text-gray-300 uppercase">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/sales/invoice/${sale.id}`)}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all shadow-sm"
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[11px] text-gray-400 font-medium uppercase">
              Displaying {startIndex + 1}–{Math.min(startIndex + ROWS_PER_PAGE, filtered.length)} of {filtered.length} records
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
        </>
      )}
    </div>
  );
}