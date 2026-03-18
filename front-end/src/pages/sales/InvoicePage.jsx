// src/pages/sales/InvoicePage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import logo from "../../assets/famcarelogo.png";

export default function InvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [converting, setConverting] = useState(false);
  const [receiptExists, setReceiptExists] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await API.get(`/sales/receipt/${id}`);
        setInvoice(res.data.sale);
        setItems(res.data.items);
      } catch (err) {
        console.error("Error fetching invoice:", err);
      }
    };

    const checkReceipt = async () => {
      try {
        const res = await API.get(`/receipts`);
        const exists = res.data.some((r) => String(r.sale_id) === String(id));
        setReceiptExists(exists);
      } catch (err) {
        console.error("Error checking receipt:", err);
      }
    };

    fetchInvoice();
    checkReceipt();
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
    setConverting(true);
    try {
      await API.post(`/sales/${id}/convert-to-receipt`);
      alert("✅ Receipt generated successfully!");
      setReceiptExists(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate receipt");
    } finally {
      setConverting(false);
    }
  };

  if (!invoice) return <p className="p-6 text-center">Loading invoice...</p>;

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const isPaid = invoice.payment_method !== "credit" && invoice.payment_method !== "insurance";

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Container for Printing */}
      <div
        ref={printRef}
        className="bg-white p-10 text-gray-800 leading-tight"
        style={{ minHeight: "297mm", fontFamily: "serif" }}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-orange-400 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-700">FAM<span className="text-orange-500">CARE</span></h1>
            <p className="text-xs italic text-orange-600 font-semibold">For All Your Needs, We Deliver</p>
            <p className="text-xs font-bold mt-1 uppercase text-gray-500 tracking-widest">REHAB & MEDICAL SUPPLIES</p>
            <img 
  src={logo} 
  alt="Company Logo" 
  className="mt-2 w-24 object-contain"
/>
          </div>
          <div className="text-right text-sm">
            <h2 className="font-bold text-lg">Famcare Rehab & Medical Supplies Ltd.</h2>
            <p className="font-bold text-lg">Nakuru office:</p>
            <p className="font-bold text-lg">Highway Towers, 4th floor Room 405</p>
            <p className="font-bold text-lg">Nairobi Office:</p>
            <p className="font-bold text-lg">Devt Hse 2nd Flr Room 18</p>
            <p className="font-bold text-lg">Tel: +254 (0) 773 991 127</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold border-b border-gray-300 inline-block px-4 pb-1">INVOICE/DELIVERY NOTE</h3>
        </div>

        {/* Customer & Invoice Meta */}
        <div className="flex justify-between mb-8 text-sm">
          <div className="space-y-1">
            <p><strong>Customer ID:</strong> {invoice.customer_name?.toUpperCase() || "VALLEY HOSPITAL LTD"}</p>
            <p><strong>Date:</strong> {new Date(invoice.created_at).toLocaleDateString('en-GB')}</p>
          </div>
          <div className="text-right">
            <p><strong>INV No:</strong> {invoice.invoice_number || `FCR/${id}/2026`}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-6 border-collapse border border-gray-300">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="p-2 border-r border-gray-300 text-center w-16">Qty</th>
              <th className="p-2 border-r border-gray-300 text-center w-16">Unit</th>
              <th className="p-2 border-r border-gray-300 text-left">Description</th>
              <th className="p-2 border-r border-gray-300 text-right">Rate</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="h-10 border-b border-gray-200">
                <td className="p-2 border-r border-gray-300 text-center">{item.quantity}</td>
                <td className="p-2 border-r border-gray-300 text-center">Pcs</td>
                <td className="p-2 border-r border-gray-300">{item.product_name}</td>
                <td className="p-2 border-r border-gray-300 text-right">{Number(item.price).toLocaleString()}</td>
                <td className="p-2 text-right font-medium">{(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (
              <tr key={`empty-${i}`} className="h-10 border-b border-gray-200">
                <td className="border-r border-gray-300"></td>
                <td className="border-r border-gray-300"></td>
                <td className="border-r border-gray-300"></td>
                <td className="border-r border-gray-300"></td>
                <td></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-400 font-bold bg-gray-50">
              <td colSpan="4" className="p-2 text-right border-r border-gray-300 uppercase tracking-wider">TOTAL</td>
              <td className="p-2 text-right">Ksh. {totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        {/* Terms & Conditions */}
        <div className="text-[18px] text-gray-600 mb-10 italic">
          <p className="font-bold underline mb-1">Terms & Conditions</p>
          <ol className="list-decimal ml-4 space-y-0.5">
            <li>Famcare Rehab & Medical Supplies Ltd is a fully registered company, fully compliant.</li>
            <li>Goods are ready for dispatch immediately we receive a Local purchasing Order.</li>
            <li>50% of the total amount should be paid upon agreement with the supplier and remaining 50% after signing the delivery note.
              Incase payments exceed 30 days from the date of invoice,3% will be charged on all overdue accounts.If not acceptable,
              inform the company immediately or else signing the delivery note becomes a binding contract.</li>
            <li>Notice should be given to us of any goods not received within a minimum of 2 working days and a maximum of 7 days from
              the date of dispatch stated on the invoice.</li>
            <li>Any damage must be notified within 72 hours of receipt of goods and no goods maybe returned without prior authorization from the company</li>
          </ol>
        </div>

        {/* Signatures */}
        <div className="flex justify-between text-sm mt-12 pt-8">
  <div className="w-1/2">
    <p className="mb-4">Delivered by: ________________________ Date: ___________ Signature:___________  </p>
    <p>Received by: _________________________ Date: ___________ Signature:___________</p>
  </div>
          <div className="w-1/3 text-right">
            <p className="mb-10 text-center italic text-gray-400"></p>
            <div className="border-t border-gray-400 pt-1 text-center font-bold"></div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-[14px] text-center border-t border-gray-100 pt-4 text-gray-400">
          Email: famcarerehab@gmail.com/salea@famcare.co.ke | Web: https://famcareltd.co.ke
          Dealers in:-Sports,Physiotherapy,Occupational,Orthopedic.Laboratory,Medical Equipments and other Consumables
        </div>
      </div>

      {/* Action Buttons (Non-Printing) */}
      <div className="mt-8 flex gap-4 print:hidden">
        <button onClick={handlePrint} className="bg-gray-800 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">
          🖨️ Print Invoice
        </button>

        {/* Convert to Receipt button — only show for cash/mpesa/card and if receipt doesn't exist yet */}
        {isPaid && !receiptExists && (
          <button
            onClick={handleConvertToReceipt}
            disabled={converting}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
          >
            {converting ? "Converting..." : "🧾 Convert to Receipt"}
          </button>
        )}

        {/* Show message if receipt already exists */}
        {receiptExists && (
          <span className="bg-green-50 border border-green-300 text-green-700 px-6 py-3 rounded-lg font-semibold text-sm flex items-center">
            ✅ Receipt already generated
          </span>
        )}

        {/* Show message if payment method doesn't support receipt */}
        {!isPaid && (
          <span className="bg-yellow-50 border border-yellow-300 text-yellow-700 px-6 py-3 rounded-lg font-semibold text-sm flex items-center">
            🕐 Pending payment — receipt not available
          </span>
        )}

        <button onClick={() => navigate(-1)} className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold">
          Back
        </button>
      </div>
    </div>
  );
}