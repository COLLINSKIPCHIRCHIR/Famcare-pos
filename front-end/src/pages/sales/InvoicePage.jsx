// src/pages/sales/InvoicePage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function InvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const printRef = useRef();

  // Allowed payment methods for receipt generation
  const allowedMethods = ["cash", "mpesa", "card"];
  const canGenerateReceipt =
    invoice && allowedMethods.includes(invoice.payment_method?.toLowerCase());

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get(`http://localhost:5003/api/sales/receipt/${id}`);
        setInvoice(res.data.sale);
        setItems(res.data.items);
      } catch (err) {
        console.error("Error fetching invoice:", err);
      }
    };
    fetchInvoice();
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

  const handleConvertToReceipt = async () => {
    try {
      await axios.post(`http://localhost:5003/api/sales/${invoice.id}/convert-to-receipt`);
      alert("Receipt generated successfully!");
      navigate("/sales/receipts"); // Redirect to receipts list
    } catch (err) {
      alert(err.response?.data?.message || "Error generating receipt");
    }
  };

  if (!invoice) return <p className="p-6 text-center">Loading invoice...</p>;

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <div ref={printRef}>
        <h2 className="text-2xl font-bold mb-4">Invoice #{invoice.invoice_number}</h2>
        <p><strong>Customer:</strong> {invoice.customer_name || "—"}</p>
        <p><strong>Date:</strong> {new Date(invoice.created_at).toLocaleString()}</p>
        <p><strong>Payment Method:</strong> {invoice.payment_method}</p>

        <table className="w-full text-sm border mt-4">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}> {/* ✅ use unique id from sales_items */}
                <td className="p-2">{item.product_name}</td>
                <td className="p-2 text-center">{item.quantity}</td>
                <td className="p-2 text-right">KES {item.price.toLocaleString()}</td>
                <td className="p-2 text-right">KES {(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="font-bold border-t">
              <td colSpan="3" className="p-2 text-right">Total</td>
              <td className="p-2 text-right">KES {totalAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center mt-6">
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
        >
          🖨 Print Invoice
        </button>

        {canGenerateReceipt && (
          <button
            onClick={handleConvertToReceipt}
            className="ml-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
          >
            Convert to Receipt
          </button>
        )}
      </div>
    </div>
  );
}