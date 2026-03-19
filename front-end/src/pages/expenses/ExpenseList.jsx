import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const ROWS_PER_PAGE = 10;

export default function ExpenseList() {
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [from, setFrom]           = useState("");
  const [to, setTo]               = useState("");
  const navigate = useNavigate();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = from && to ? `?from=${from}&to=${to}` : "";
      const res = await API.get(`/expenses${params}`);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await API.delete(`/expenses/${id}`);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (err) {
      alert("Failed to delete expense");
    }
  };

  const filtered = expenses.filter((e) =>
    e.category_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated  = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const totalAmount = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
        <button
          onClick={() => navigate("/expenses/add")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700"
        >
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search category or description..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="border border-gray-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64"
        />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
        <button onClick={fetchExpenses}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
          Filter
        </button>
        {(from || to || search) && (
          <button onClick={() => { setFrom(""); setTo(""); setSearch(""); fetchExpenses(); }}
            className="text-xs font-bold text-red-500 uppercase">
            ✕ Clear
          </button>
        )}
      </div>

      {/* Total */}
      <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-5 py-3 inline-block">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Expenses</p>
        <p className="text-2xl font-bold text-red-600">KES {totalAmount.toLocaleString()}</p>
      </div>

      {loading && <p className="text-center py-10 text-gray-400 animate-pulse">Loading...</p>}

      {!loading && (
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                  <th className="p-4">#</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Amount (KES)</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-gray-400 italic">
                      No expenses found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((e, index) => (
                    <tr key={e.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-4 text-xs font-bold text-gray-300">{startIndex + index + 1}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(e.expense_date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                          {e.category_name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{e.description || "—"}</td>
                      <td className="p-4 text-sm capitalize text-gray-600">{e.payment_method}</td>
                      <td className="p-4 font-bold text-red-600">
                        {Number(e.amount).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="text-red-400 hover:text-red-600 text-xs font-bold uppercase"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="bg-gray-50 p-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {startIndex + 1}–{Math.min(startIndex + ROWS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 disabled:opacity-30">
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                      currentPage === page ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50"
                    }`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 disabled:opacity-30">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}