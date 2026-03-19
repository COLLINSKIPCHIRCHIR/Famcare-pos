import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../utils/api";

export default function DeliveryNoteCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillSaleId  = searchParams.get("sale_id") || "";

  const [sales, setSales]           = useState([]);
  const [saleId, setSaleId]         = useState(prefillSaleId);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveredBy, setDeliveredBy]         = useState("");
  const [notes, setNotes]           = useState("");
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    API.get("/sales/list").then((r) => setSales(r.data));
  }, []);

  useEffect(() => {
    if (!saleId || sales.length === 0) return;
    const sale = sales.find((s) => String(s.id) === String(saleId));
    if (sale) setCustomerId(sale.customer_id);
  }, [saleId, sales]);

  const handleSubmit = async () => {
    if (!saleId) return setError("Please select a sale");
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/delivery-notes", {
        sale_id: saleId,
        customer_id: customerId,
        delivery_address: deliveryAddress,
        delivered_by: deliveredBy,
        notes,
      });
      navigate(`/delivery-notes/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create delivery note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Delivery Note</h2>

      {error && (
        <p className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Sale / Invoice</label>
          <select
            value={saleId}
            onChange={(e) => setSaleId(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select a sale...</option>
            {sales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.invoice_number} — {s.customer_name || "Walk-in Customer"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Delivery Address</label>
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="e.g. Valley Hospital, Nakuru"
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Delivered By</label>
          <input
            type="text"
            value={deliveredBy}
            onChange={(e) => setDeliveredBy(e.target.value)}
            placeholder="Driver / Staff name"
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special delivery instructions..."
            rows={3}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Delivery Note"}
        </button>
        <button
          onClick={() => navigate("/delivery-notes/list")}
          className="bg-gray-100 text-gray-700 px-8 py-2.5 rounded-lg font-bold hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}