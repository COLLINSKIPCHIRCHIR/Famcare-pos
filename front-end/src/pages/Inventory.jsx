import { useState, useEffect } from "react";
import axios from "axios";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", unit_price: "", stock: "" });
  const [editingId, setEditingId] = useState(null);

  const fetchItems = async () => {
    const res = await axios.get("http://localhost:5000/api/inventory");
    setItems(res.data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async () => {
    if (editingId) {
      await axios.put(`http://localhost:5000/api/inventory/${editingId}`, form);
    } else {
      await axios.post("http://localhost:5000/api/inventory", form);
    }
    setForm({ name: "", unit_price: "", stock: "" });
    setEditingId(null);
    fetchItems();
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, unit_price: item.unit_price, stock: item.stock });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/inventory/${id}`);
    fetchItems();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold mb-4">Inventory Management</h2>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Product Name"
          className="border p-2 mr-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Unit Price"
          className="border p-2 mr-2"
          value={form.unit_price}
          onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
        />
        <input
          type="number"
          placeholder="Stock"
          className="border p-2 mr-2"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleSubmit}
        >
          {editingId ? "Update" : "Add"}
        </button>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Product</th>
            <th className="p-2">Unit Price</th>
            <th className="p-2">Stock</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-2">{item.name}</td>
              <td className="p-2">{item.unit_price}</td>
              <td className="p-2">{item.stock}</td>
              <td className="p-2">
                <button
                  className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}