import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

export default function ProformaCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers]   = useState([]);
  const [inventory, setInventory]   = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes]           = useState("");
  const [cart, setCart]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    API.get("/customers/list").then((r) => setCustomers(r.data));
    API.get("/inventory").then((r) => setInventory(r.data));
  }, []);

  const addItem = () => {
    setCart([...cart, { product_id: "", price: "", quantity: 1 }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...cart];
    updated[index][field] = value;

    // Auto-fill price from inventory
    if (field === "product_id") {
      const product = inventory.find((i) => String(i.id) === String(value));
      if (product) updated[index].price = product.selling_price;
    }
    setCart(updated);
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const total = cart.reduce((sum, item) => sum + (item.quantity * item.price || 0), 0);

  const handleSubmit = async () => {
   // if (!customerId) return setError("Please select a customer");
    if (cart.length === 0) return setError("Add at least one item");
    if (cart.some((i) => !i.product_id || !i.price || !i.quantity))
      return setError("Fill in all item fields");

    setLoading(true);
    setError("");
    try {
      await API.post("/proforma", {
        customer_id: customerId || null,
        items: cart,
        valid_until: validUntil || null,
        notes,
        });
      navigate("/proforma/list");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create proforma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Proforma Invoice</h2>

      {error && (
        <p className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Customer</label>
         <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
            <option value="">🚶 Walk-in Customer</option>
            {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            </select>
        </div>
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Valid Until</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Items */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Items</h3>
          <button
            onClick={addItem}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700"
          >
            + Add Item
          </button>
        </div>

        {cart.length === 0 && (
          <p className="text-center text-gray-400 italic text-sm py-6 border border-dashed border-gray-200 rounded-lg">
            No items added yet. Click "+ Add Item" to start.
          </p>
        )}

        {cart.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
            <div className="col-span-5">
              <select
                value={item.product_id}
                onChange={(e) => updateItem(index, "product_id", e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select product...</option>
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} {i.size !== "N/A" ? `(${i.size})` : ""} — Stock: {i.quantity}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <input
                type="number"
                placeholder="Unit Price"
                value={item.price}
                onChange={(e) => updateItem(index, "price", e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                placeholder="Qty"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">
                {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
              </span>
              <button
                onClick={() => removeItem(index)}
                className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="flex justify-end mb-6">
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-6 py-3 text-right">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">KES {total.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Create Proforma Invoice"}
        </button>
        <button
          onClick={() => navigate("/proforma/list")}
          className="bg-gray-100 text-gray-700 px-8 py-2.5 rounded-lg font-bold hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}