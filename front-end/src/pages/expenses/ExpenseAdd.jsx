import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

export default function ExpenseAdd() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: "",
    description: "",
    amount: "",
    payment_method: "cash",
    expense_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    API.get("/expenses/categories").then((r) => setCategories(r.data));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.expense_date)
      return setError("Amount and date are required");

    setLoading(true);
    setError("");
    try {
      await API.post("/expenses", form);
      navigate("/expenses/list");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Expense</h2>

      {error && (
        <p className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Category</label>
          <select name="category_id" value={form.category_id} onChange={handleChange}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Description</label>
          <input type="text" name="description" value={form.description} onChange={handleChange}
            placeholder="e.g. March rent payment"
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Amount (KES)</label>
          <input type="number" name="amount" value={form.amount} onChange={handleChange}
            placeholder="0.00"
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Payment Method</label>
          <select name="payment_method" value={form.payment_method} onChange={handleChange}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank">Bank Transfer</option>
            <option value="card">Card</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Date</label>
          <input 
            type="date" 
            name="expense_date" 
            value={form.expense_date} 
            onChange={handleChange}
            min={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]}  // 1st of current month
            max={new Date().toISOString().split("T")[0]}  // today
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" 
        />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Save Expense"}
          </button>
          <button type="button" onClick={() => navigate("/expenses/list")}
            className="bg-gray-100 text-gray-700 px-8 py-2.5 rounded-lg font-bold hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}