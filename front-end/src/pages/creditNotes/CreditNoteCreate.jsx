import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../utils/api";

export default function CreditNoteCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillSaleId  = searchParams.get("sale_id") || "";

  const [sales, setSales]       = useState([]);
  const [saleId, setSaleId]     = useState(prefillSaleId);
  const [saleItems, setSaleItems] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [reason, setReason]     = useState("");
  const [cart, setCart]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    API.get("/sales/list").then((r) => setSales(r.data));
  }, []);

  // When a sale is selected, load its items
  useEffect(() => {
    if (!saleId) return;
    const sale = sales.find((s) => String(s.id) === String(saleId));
    if (sale) setCustomerId(sale.customer_id);

    API.get(`/sales/receipt/${saleId}`)
      .then((r) => {
        setSaleItems(r.data.items);
        // Pre-fill all items as returnable
        setCart(r.data.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: 1,
          max_quantity: item.quantity,
        })));
      })
      .catch(console.error);
  }, [saleId, sales]);

  const updateQty = (index, value) => {
    const updated = [...cart];
    updated[index].quantity = Math.min(Number(value), updated[index].max_quantity);
    setCart(updated);
  };

  const toggleItem = (index) => {
    const updated = [...cart];
    updated[index].included = !updated[index].included;
    setCart(updated);
  };

  const includedItems = cart.filter((i) => i.included !== false);
  const total = includedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!saleId) return setError("Please select a sale");
    if (includedItems.length === 0) return setError("Select at least one item to return");
    if (!reason) return setError("Please provide a reason");

    setLoading(true);
    setError("");
    try {
      await API.post("/credit-notes", {
        sale_id: saleId,
        customer_id: customerId,
        reason,
        items: includedItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.price,
        })),
      });
      navigate("/credit-notes/list");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create credit note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Credit Note</h2>

      {error && (
        <p className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Select Sale / Invoice</label>
          <select
            value={saleId}
            onChange={(e) => setSaleId(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select a sale...</option>
            {sales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.invoice_number} — {s.customer_name || "Walk-in Customer"} — KES {Number(s.total_amount).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Reason for Credit Note</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Damaged goods, wrong item delivered..."
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Items from the sale */}
      {cart.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
            Select Items to Return
          </h3>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                  <th className="p-3">Include</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-center">Return Qty (max: orig)</th>
                  <th className="p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cart.map((item, index) => (
                  <tr key={index} className={item.included === false ? "opacity-40" : ""}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.included !== false}
                        onChange={() => toggleItem(index)}
                        className="w-4 h-4 accent-blue-600"
                      />
                    </td>
                    <td className="p-3 font-medium text-gray-800">{item.product_name}</td>
                    <td className="p-3 text-right text-gray-600">KES {Number(item.price).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="1"
                        max={item.max_quantity}
                        value={item.quantity}
                        onChange={(e) => updateQty(index, e.target.value)}
                        disabled={item.included === false}
                        className="w-20 border border-gray-200 px-2 py-1 rounded text-center text-sm focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-gray-400 ml-1">/ {item.max_quantity}</span>
                    </td>
                    <td className="p-3 text-right font-bold text-gray-800">
                      KES {(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-6 py-3 text-right">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Credit Amount</p>
              <p className="text-2xl font-bold text-red-600">KES {total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Issue Credit Note"}
        </button>
        <button
          onClick={() => navigate("/credit-notes/list")}
          className="bg-gray-100 text-gray-700 px-8 py-2.5 rounded-lg font-bold hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}