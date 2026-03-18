// src/pages/inventory/Inventory.jsx
import { useState, useEffect } from "react";
import API from "../../utils/api";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", unit_price: "", stock: "" });
  const [editingId, setEditingId] = useState(null);

  const fetchItems = async () => {
    try {
      const res = await API.get("/inventory");
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Added preventDefault for better form handling
    try {
      if (editingId) {
        await API.put(`/inventory/${editingId}`, form);
      } else {
        await API.post("/inventory", form);
      }
      setForm({ name: "", unit_price: "", stock: "" });
      setEditingId(null);
      fetchItems();
    } catch (err) {
      console.error("Error saving item:", err);
    }
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, unit_price: item.unit_price, stock: item.stock });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this item from inventory? This action cannot be undone.")) {
      try {
        await API.delete(`/inventory/${id}`);
        fetchItems();
      } catch (err) {
        console.error("Error deleting item:", err);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {items.length} Products Tracked
        </div>
      </div>

      {/* Product Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h3 className="text-sm font-black text-blue-600 uppercase mb-4">
          {editingId ? "📝 Edit Product" : "📦 Add New Product"}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Product Name"
            className="flex-1 min-w-[200px] border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Unit Price (KES)"
            className="w-40 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Current Stock"
            className="w-32 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className={`${
                editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
              } text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm`}
            >
              {editingId ? "Update Item" : "Add to Stock"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm({ name: "", unit_price: "", stock: "" }); }}
                className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              <th className="p-4">Product Name</th>
              <th className="p-4">Unit Price</th>
              <th className="p-4">In Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">Syncing inventory...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">No products in inventory yet.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{item.name}</td>
                  <td className="p-4 font-mono text-sm text-gray-600">
                    KES {Number(item.unit_price).toLocaleString()}
                  </td>
                  <td className="p-4 font-black text-gray-900">
                    {item.stock}
                  </td>
                  <td className="p-4">
                    {item.stock <= 5 ? (
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter animate-pulse">
                        Low Stock
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                        Healthy
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button
                      className="text-amber-500 hover:text-amber-700 font-bold text-xs uppercase tracking-tight"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-tight"
                      onClick={() => handleDelete(item.id)}
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
    </div>
  );
}