// src/pages/suppliers/SuppliersList.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const ROWS_PER_PAGE = 10;

export default function SuppliersList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const scrollTable = (direction) => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/suppliers/${id}`);
      setDeleteId(null);
      fetchSuppliers();
    } catch (err) {
      alert("Failed to delete supplier");
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").includes(search) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Suppliers</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
              {suppliers.length} Partner{suppliers.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <button
            onClick={() => navigate("/suppliers/add")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm uppercase tracking-widest"
          >
            + Add Supplier
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-4 pl-12 border-2 border-transparent bg-white rounded-2xl shadow-sm focus:border-blue-500 outline-none transition-all font-medium text-gray-700"
          />
          <span className="absolute left-4 top-4 opacity-30 text-xl">🔍</span>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gray-400 font-bold animate-pulse uppercase tracking-widest">Loading database...</div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center text-gray-400 italic font-medium">
              {search ? `No suppliers match "${search}"` : "Your supplier list is empty."}
            </div>
          ) : (
            <>
              {/* Scrollable table wrapper */}
              <div ref={tableRef} className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier Name</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((s, i) => (
                      <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-4 text-xs font-bold text-gray-300">{startIndex + i + 1}</td>
                        <td className="p-4 font-black text-gray-800">{s.name}</td>
                        <td className="p-4 text-sm text-gray-600 font-medium">{s.phone || <span className="text-gray-200">—</span>}</td>
                        <td className="p-4 text-sm text-blue-500 font-medium underline decoration-blue-200">{s.email || <span className="text-gray-200">—</span>}</td>
                        <td className="p-4 text-sm text-gray-500 italic truncate max-w-[200px]">{s.address || <span className="text-gray-200">—</span>}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => navigate(`/suppliers/edit/${s.id}`)}
                            className="bg-gray-100 hover:bg-blue-100 text-blue-600 font-black py-1.5 px-3 rounded-lg text-[11px] uppercase transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(s.id)}
                            className="bg-gray-100 hover:bg-red-100 text-red-500 font-black py-1.5 px-3 rounded-lg text-[11px] uppercase transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {startIndex + 1}–{Math.min(startIndex + ROWS_PER_PAGE, filtered.length)} of {filtered.length} suppliers
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

        {/* Mobile scroll buttons — shown only on small screens */}
        {!loading && filtered.length > 0 && (
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
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
              <h3 className="text-xl font-black text-gray-800">Confirm Deletion</h3>
              <p className="text-sm text-gray-500 mt-2 font-medium">Removing this supplier might affect your inventory history. This cannot be undone.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl transition-all"
              >
                Go Back
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl shadow-lg shadow-red-100 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}