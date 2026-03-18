import { useEffect, useState } from "react";
import API from "../../utils/api";
import useRole from "../../utils/useRole";

const SIZES = ["N/A", "Extra Small", "Small", "Medium", "Large", "Extra Large", "One Size","XXL"];
const ROWS_PER_PAGE = 10;

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Expired", color: "bg-red-100 text-red-700" };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, color: "bg-yellow-100 text-yellow-700" };
  return { label: expiry.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }), color: "bg-green-100 text-green-700" };
}

export default function InventoryList() {
  const { isAdmin } = useRole();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit state
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/inventory/list");
      setInventory(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterStatus]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [editItem]);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await API.delete(`/inventory/${deleteId}`);
      setDeleteId(null);
      setDeleteName("");
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      size: item.size || "N/A",
      quantity: item.quantity,
      buying_price: item.buying_price,
      selling_price: item.selling_price,
      expiry_date: item.expiry_date ? item.expiry_date.split("T")[0] : "",
    });
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await API.put(`/inventory/${editItem.id}`, editForm);
      setEditItem(null);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const expiredCount = inventory.filter(i => i.expiry_date && new Date(i.expiry_date) < new Date()).length;
  const nearExpiryCount = inventory.filter(i => {
    if (!i.expiry_date) return false;
    const daysLeft = Math.ceil((new Date(i.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 30;
  }).length;

  const filtered = inventory.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.name?.toLowerCase().includes(q) ||
      item.size?.toLowerCase().includes(q);
    const expiry = getExpiryStatus(item.expiry_date);
    const isExpired = expiry?.label === "Expired";
    const isLowStock = item.quantity < 5;
    if (filterStatus === "expired") return matchesSearch && isExpired;
    if (filterStatus === "low_stock") return matchesSearch && isLowStock;
    if (filterStatus === "in_stock") return matchesSearch && !isLowStock && !isExpired;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Inventory List</h2>

      {expiredCount > 0 && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-3 font-medium">
          ⚠️ {expiredCount} product{expiredCount > 1 ? "s have" : " has"} expired and should be removed from stock.
        </div>
      )}
      {nearExpiryCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 px-4 py-3 rounded mb-4 font-medium">
          🕐 {nearExpiryCount} product{nearExpiryCount > 1 ? "s are" : " is"} expiring within 30 days.
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name or size..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-4 py-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-sm text-gray-400 hover:text-red-500">
              ✕ Clear
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "in_stock", label: "In Stock" },
            { key: "low_stock", label: "Low Stock" },
            { key: "expired", label: "Expired" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilterStatus(btn.key)}
              className={`px-3 py-2 rounded text-sm font-semibold border transition ${
                filterStatus === btn.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Loading inventory...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && inventory.length === 0 && <p>No inventory items found. Add some first.</p>}
      {!loading && inventory.length > 0 && filtered.length === 0 && (
        <p className="text-gray-500">No items match your search or filter.</p>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">#</th>
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Size</th>
                <th className="border px-4 py-2 text-left">Quantity</th>
                <th className="border px-4 py-2 text-left">Buying Price (Ksh)</th>
                <th className="border px-4 py-2 text-left">Selling Price (Ksh)</th>
                <th className="border px-4 py-2 text-left">Expiry Date</th>
                <th className="border px-4 py-2 text-left">Stock Status</th>
                {isAdmin && <th className="border px-4 py-2 text-left">Action</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map((item, index) => {
                const expiry = getExpiryStatus(item.expiry_date);
                return (
                  <tr key={item.id} className={item.quantity < 5 ? "bg-red-50" : ""}>
                    <td className="border px-4 py-2">{startIndex + index + 1}</td>
                    <td className="border px-4 py-2 font-medium">{item.name}</td>
                    <td className="border px-4 py-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                        {item.size || "N/A"}
                      </span>
                    </td>
                    <td className="border px-4 py-2">{item.quantity}</td>
                    <td className="border px-4 py-2">{item.buying_price}</td>
                    <td className="border px-4 py-2">{item.selling_price}</td>
                    <td className="border px-4 py-2">
                      {expiry ? (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${expiry.color}`}>
                          {expiry.label}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      {item.quantity < 5 ? (
                        <span className="text-red-600 font-semibold">Low Stock</span>
                      ) : (
                        <span className="text-green-600 font-semibold">In Stock</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="border px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded font-semibold"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => { setDeleteId(item.id); setDeleteName(item.name); }}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded font-semibold"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Bar */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-400">
              Showing {startIndex + 1}–{Math.min(startIndex + ROWS_PER_PAGE, filtered.length)} of {filtered.length} products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-bold rounded border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm font-bold rounded border transition ${
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
                className="px-3 py-1 text-sm font-bold rounded border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 999, overflowY: "auto", padding: "40px 0" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", flexShrink: 0 }}>
            <h3 style={{ margin: "0 0 20px", color: "#1a1a2e", fontSize: 18, fontWeight: 700 }}>✏️ Edit Product</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", marginTop: 4, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Size</label>
                <select
                  value={editForm.size}
                  onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                  style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", marginTop: 4, fontSize: 14 }}
                >
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Quantity</label>
                <input
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", marginTop: 4, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Buying Price (Ksh)</label>
                <input
                  type="number"
                  value={editForm.buying_price}
                  onChange={(e) => setEditForm({ ...editForm, buying_price: e.target.value })}
                  style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", marginTop: 4, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Selling Price (Ksh)</label>
                <input
                  type="number"
                  value={editForm.selling_price}
                  onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })}
                  style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", marginTop: 4, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={editForm.expiry_date}
                  onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                  style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", marginTop: 4, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
              <button
                onClick={() => setEditItem(null)}
                style={{ background: "#f4f4f4", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>🗑 Delete Product?</h3>
            <p style={{ color: "#555", marginBottom: 8 }}>
              You are about to permanently delete <strong>{deleteName}</strong> from inventory.
            </p>
            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 20 }}>
              ⚠️ This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setDeleteId(null); setDeleteName(""); }}
                style={{ background: "#f4f4f4", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}