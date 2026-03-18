import { useEffect, useRef, useState } from "react";
import API from "../../utils/api";

const ROWS_PER_PAGE = 10;

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/customers/list");
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const scrollTable = (direction) => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Directory</h2>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-tighter"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {loading && <p className="text-center py-10 text-gray-400 animate-pulse">Loading directory...</p>}
      {error && <p className="p-4 bg-red-50 text-red-600 rounded-lg mb-4 text-sm font-medium border border-red-100">{error}</p>}

      {!loading && !error && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
            {/* Scrollable table wrapper */}
            <div ref={tableRef} className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="p-4">#</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Joined</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-10 text-center text-gray-400 italic">
                        {search ? `No results for "${search}"` : "No customers in the database."}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((customer, index) => (
                      <tr key={customer.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="p-4 text-xs font-bold text-gray-300">{startIndex + index + 1}</td>
                        <td className="p-4 font-bold text-gray-800">{customer.name}</td>
                        <td className="p-4 text-sm text-gray-600">{customer.phone || "—"}</td>
                        <td className="p-4 text-sm text-blue-500 underline">{customer.email || "—"}</td>
                        <td className="p-4 text-xs text-gray-400 uppercase font-medium">
                          {new Date(customer.created_at).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with pagination */}
            {filtered.length > 0 && (
              <div className="bg-gray-50 p-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {startIndex + 1}–{Math.min(startIndex + ROWS_PER_PAGE, filtered.length)} of {filtered.length} customers
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

          {/* Mobile scroll buttons — shown only on small screens */}
          <div className="flex justify-center gap-4 mt-3 md:hidden">
            <button
              onClick={() => scrollTable("left")}
              className="flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg border border-gray-200 transition"
            >
              ← Scroll Left
            </button>
            <button
              onClick={() => scrollTable("right")}
              className="flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg border border-gray-200 transition"
            >
              Scroll Right →
            </button>
          </div>
        </>
      )}
    </div>
  );
}