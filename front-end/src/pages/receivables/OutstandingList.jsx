import { useEffect, useState } from "react";
import API from "../../utils/api";

export default function OutstandingList() {
  const [outstanding, setOutstanding] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: "", payment_method: "cash", payment_date: new Date().toISOString().split("T")[0], notes: ""
  });
  const [paying, setPaying] = useState(false);
  const [error, setError]   = useState("");

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const res = await API.get("/receivables/outstanding");
      setOutstanding(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOutstanding(); }, []);

  const totalOutstanding = outstanding.reduce((sum, r) => sum + parseFloat(r.balance), 0);

  const handlePayment = async () => {
    if (!paymentForm.amount_paid) return setError("Enter amount paid");
    setPaying(true);
    setError("");
    try {
      await API.post("/receivables/payments", {
        customer_id:    selected.customer_id,
        sale_id:        selected.sale_id,
        amount_paid:    parseFloat(paymentForm.amount_paid),
        payment_method: paymentForm.payment_method,
        payment_date:   paymentForm.payment_date,
        notes:          paymentForm.notes,
      });
      setSelected(null);
      fetchOutstanding();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record payment");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Accounts Receivable</h2>

      {/* Total Outstanding */}
      <div className="mb-6 bg-orange-50 border border-orange-100 rounded-xl px-5 py-3 inline-block">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Outstanding</p>
        <p className="text-2xl font-bold text-orange-600">KES {totalOutstanding.toLocaleString()}</p>
      </div>

      {loading && <p className="text-center py-10 text-gray-400 animate-pulse">Loading...</p>}

      {!loading && (
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                  <th className="p-4">#</th>
                  <th className="p-4">Invoice</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Invoice Amount</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {outstanding.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-10 text-center text-gray-400 italic">
                      No outstanding balances. 🎉
                    </td>
                  </tr>
                ) : (
                  outstanding.map((r, index) => (
                    <tr key={r.sale_id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-4 text-xs font-bold text-gray-300">{index + 1}</td>
                      <td className="p-4 font-bold text-blue-600">{r.invoice_number}</td>
                      <td className="p-4 font-semibold text-gray-800">{r.customer_name || "—"}</td>
                      <td className="p-4 text-sm text-gray-500">{r.customer_phone || "—"}</td>
                      <td className="p-4 text-gray-700">KES {Number(r.total_amount).toLocaleString()}</td>
                      <td className="p-4 text-green-600 font-semibold">
                        KES {Number(r.total_paid).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-orange-600">
                        KES {Number(r.balance).toLocaleString()}
                      </td>
                      <td className="p-4 text-xs text-gray-400 uppercase font-medium">
                        {new Date(r.created_at).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => { setSelected(r); setError(""); }}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-700"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Record Payment</h3>
            <p className="text-sm text-gray-500 mb-4">
              Invoice: <strong>{selected.invoice_number}</strong> —
              Balance: <strong className="text-orange-600">KES {Number(selected.balance).toLocaleString()}</strong>
            </p>

            {error && (
              <p className="mb-3 p-2 bg-red-50 border border-red-100 text-red-600 rounded text-sm">{error}</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Amount Paid (KES)</label>
                <input type="number" value={paymentForm.amount_paid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                  placeholder={`Max: ${Number(selected.balance).toLocaleString()}`}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Payment Method</label>
                <select value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Payment Date</label>
                <input type="date" value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
                <input type="text" value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional..."
                  className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handlePayment} disabled={paying}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex-1">
                {paying ? "Saving..." : "Confirm Payment"}
              </button>
              <button onClick={() => setSelected(null)}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}