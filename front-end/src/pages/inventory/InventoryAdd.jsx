// src/pages/inventory/InventoryAdd.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SIZES = ["N/A", "Extra Small", "Small", "Medium", "Large", "Extra Large", "One Size"];

export default function InventoryAdd() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    size: "N/A",
    quantity: "",
    buying_price: "",
    selling_price: "",
    expiry_date: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.name || !form.quantity || !form.buying_price || !form.selling_price) {
      setError("Name, quantity, buying price and selling price are required.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/inventory/add",
        {
          name: form.name,
          size: form.size,
          quantity: parseInt(form.quantity),
          buying_price: parseFloat(form.buying_price),
          selling_price: parseFloat(form.selling_price),
          expiry_date: form.expiry_date || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/inventory/list");
    } catch (err) {
      console.error(err);
      setError(err.response?.data || "Failed to add inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Add Inventory</h2>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Product Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="e.g. Bandage, Gloves, Syringe..."
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Size / Variant</label>
          <select
            name="size"
            value={form.size}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white"
          >
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Select "N/A" if this product has no size variation</p>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            min="1"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Buying Price (Ksh)</label>
          <input
            type="number"
            name="buying_price"
            value={form.buying_price}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Selling Price (Ksh)</label>
          <input
            type="number"
            name="selling_price"
            value={form.selling_price}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            name="expiry_date"
            value={form.expiry_date}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank if this product does not expire</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Add Inventory"}
        </button>
      </form>
    </div>
  );
}