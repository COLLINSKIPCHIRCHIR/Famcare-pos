// src/pages/sales/ReceiptPage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import logo from "../../assets/famcarelogo.png";

export default function ReceiptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [items, setItems] = useState([]);
  const printRef = useRef();

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        // Updated to use the API utility with relative path
        const res = await API.get(`/receipts/${id}`);
        setReceipt(res.data.receipt);
        setItems(res.data.items);
      } catch (err) {
        console.error("Error fetching receipt:", err);
      }
    };
    fetchReceipt();
  }, [id]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  if (!receipt) return <p className="p-6 text-center">Loading receipt...</p>;

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <div ref={printRef} style={{ fontFamily: "'Arial', sans-serif " }}>

       <div className="text-center mb-4 border-b-2 border-gray-300 pb-4 text-gray-800">

  {/* LOGO */}
  <img 
    src={logo} 
    alt="Company Logo" 
    className="mx-auto mb-2 w-22 object-contain"
  />

  <h1 className="text-2xl font-bold text-blue-700 uppercase tracking-wide">
    Famcare Rehab & Medical Supplies
  </h1>

  <p className="text-sm text-gray-600 mt-1 font-semibold">
    📞 +254 (0) 773 991 127
  </p>

  <p className="text-xs text-gray-400">
    Quality Medical Equipment You Can Trust
  </p>
</div>
        {/* Receipt Label */}
        <div className="text-center mb-4">
          <span className="bg-blue-600 text-white text-xs font-bold px-6 py-1 rounded-full uppercase tracking-widest">
            Official Receipt
          </span>
        </div>

        {/* Receipt Details */}
        <div className="text-sm mb-4 space-y-1 border-b border-dashed border-gray-300 pb-4 text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Receipt No:</span>
            <span className="font-bold text-gray-900">#{String(receipt.id).padStart(5, "0")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Date:</span>
            <span className="font-medium text-gray-900">{new Date(receipt.created_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Customer:</span>
            <span className="font-semibold text-gray-900">{receipt.customer_name || "Walk-in"}</span>
          </div>
          {receipt.customer_phone && (
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Phone:</span>
              <span className="font-medium text-gray-900">{receipt.customer_phone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Payment Method:</span>
            <span className="capitalize font-semibold text-gray-900">{receipt.payment_method}</span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-dashed border-gray-400 text-gray-500 text-xs uppercase">
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="border-b border-dashed border-gray-100">
                <td className="py-2">{item.product_name}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">KES {Number(item.price).toLocaleString()}</td>
                <td className="py-2 text-right font-semibold">
                  KES {(item.price * item.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="border-t-2 border-gray-400 pt-3 mb-6">
          <div className="flex justify-between text-lg font-bold text-blue-700">
            <span>TOTAL</span>
            <span>KES {totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t border-dashed border-gray-300 pt-4 space-y-1">
          <p className="font-semibold text-gray-700">Thank you for choosing Famcare Rehab & Medical Supplies!</p>
          <p>Goods sold are not returnable unless defective.</p>
          <p>For inquiries call: +254 (0) 773 991 127</p>
          <p className="mt-2 text-gray-400 font-medium">*** This is your official receipt ***</p>
          <p className="mt-3 text-[10px] text-gray-300">System Designed and Developed by Comax Africa</p>
        </div>

      </div>

      {/* Action Buttons (Hidden on Print) */}
      <div className="flex gap-3 mt-6 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-5 py-2 rounded font-bold hover:bg-green-700 transition"
        >
          🖨 Print Receipt
        </button>
        <button
          onClick={() => navigate("/sales/receipts")}
          className="bg-gray-200 text-gray-700 px-5 py-2 rounded font-bold hover:bg-gray-300 transition"
        >
          ← Back to Receipts
        </button>
      </div>
    </div>
  );
}