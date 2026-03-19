import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const ROWS_PER_PAGE = 10;

export default function CreditNoteList() {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/credit-notes")
      .then((res) => setNotes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = notes.filter((n) => {
  const customerName = n.customer_name || "Walk-in Customer";
  const q = search.toLowerCase();
  return (
    customerName.toLowerCase().includes(q) ||
    n.credit_number?.toLowerCase().includes(q) ||
    n.invoice_number?.toLowerCase().includes(q)
  );
});

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated  = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Credit Notes</h2>
        <button
          onClick={() => navigate("/credit-notes/new")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          + New Credit Note
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by customer, CN number or invoice..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full max-w-sm border border-gray-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        {search && <button onClick={() => setSearch("")} className="text-xs font-bold text-red-500 uppercase">✕ Clear</button>}
      </div>

      {loading && <p className="text-center py-10 text-gray-400 animate-pulse">Loading...</p>}

      {!loading && (
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="p-4">#</th>
                  <th className="p-4">CN Number</th>
                  <th className="p-4">Invoice Ref</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount (KES)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-10 text-center text-gray-400 italic">No credit notes found.</td>
                  </tr>
                ) : (
                  paginated.map((n, index) => (
                    <tr key={n.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-4 text-xs font-bold text-gray-300">{startIndex + index + 1}</td>
                      <td className="p-4 font-bold text-blue-600">{n.credit_number}</td>
                      <td className="p-4 text-gray-600">{n.invoice_number || "—"}</td>
                      <td className="p-4 font-semibold text-gray-800">{n.customer_name || "Walk-in Customer"}</td>
                      <td className="p-4 text-gray-700">KES {Number(n.total_amount).toLocaleString()}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-bold capitalize bg-blue-100 text-blue-700">
                          {n.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-400 uppercase font-medium">
                        {new Date(n.created_at).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/credit-notes/${n.id}`)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}