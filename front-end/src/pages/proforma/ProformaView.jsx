import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import logo from "../../assets/famcarelogo.png";

export default function ProformaView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [proforma, setProforma] = useState(null);
  const [items, setItems]       = useState([]);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    API.get(`/proforma/${id}`)
      .then((res) => {
        setProforma(res.data.proforma);
        setItems(res.data.items);
      })
      .catch(console.error);
  }, [id]);

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const original = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  const handleConvert = async () => {
    if (!window.confirm("Convert this proforma to a sale?")) return;
    setConverting(true);
    try {
      const res = await API.post(`/proforma/${id}/convert`, { payment_method: "credit" });
      alert(`✅ Converted! Invoice: ${res.data.invoice_number}`);
      navigate(`/sales/invoice/${res.data.sale_id}`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to convert");
    } finally {
      setConverting(false);
    }
  };

  if (!proforma) return <p className="p-6 text-center text-gray-400 animate-pulse">Loading proforma...</p>;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div ref={printRef} className="bg-white p-10 text-gray-800 leading-tight" style={{ minHeight: "297mm", fontFamily: "serif" }}>

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-orange-400 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-700">FAM<span className="text-orange-500">CARE</span></h1>
            <p className="text-xs italic text-orange-600 font-semibold">For All Your Needs, We Deliver</p>
            <p className="text-xs font-bold mt-1 uppercase text-gray-500 tracking-widest">REHAB & MEDICAL SUPPLIES</p>
            <img src={logo} alt="Logo" className="mt-2 w-24 object-contain" />
          </div>
          <div className="text-right text-sm">
            <h2 className="font-bold text-lg">Famcare Rehab & Medical Supplies Ltd.</h2>
            <p className="font-bold">Nakuru Office: Highway Towers, 4th Floor Room 405</p>
            <p className="font-bold">Nairobi Office: Devt Hse 2nd Flr Room 18</p>
            <p className="font-bold">Tel: +254 (0) 773 991 127</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold border-b border-gray-300 inline-block px-4 pb-1">PROFORMA INVOICE</h3>
        </div>

        {/* Meta */}
        <div className="flex justify-between mb-8 text-sm">
          <div className="space-y-1">
            <p><strong>Customer:</strong> {proforma.customer_name?.toUpperCase() || "WALK-IN CUSTOMER"}</p>
            <p><strong>Phone:</strong> {proforma.customer_phone || "—"}</p>
            <p><strong>Date:</strong> {new Date(proforma.created_at).toLocaleDateString("en-GB")}</p>
            {proforma.valid_until && (
              <p><strong>Valid Until:</strong> {new Date(proforma.valid_until).toLocaleDateString("en-GB")}</p>
            )}
          </div>
          <div className="text-right space-y-1">
            <p><strong>Proforma No:</strong> {proforma.proforma_number}</p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`font-bold capitalize ${proforma.status === "converted" ? "text-green-600" : "text-yellow-600"}`}>
                {proforma.status}
              </span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-6 border-collapse border border-gray-300">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="p-2 border-r border-gray-300 text-center w-16">Qty</th>
              <th className="p-2 border-r border-gray-300 text-center w-16">Unit</th>
              <th className="p-2 border-r border-gray-300 text-left">Description</th>
              <th className="p-2 border-r border-gray-300 text-right">Unit Price</th>
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
              <tr key={`empty-${i}`} className="h-10 border-b border-gray-100">
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
              <td className="p-2 text-right">Ksh. {total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        {proforma.notes && (
          <p className="text-sm text-gray-600 italic mb-6"><strong>Notes:</strong> {proforma.notes}</p>
        )}

        <div className="text-sm text-gray-500 mt-10 border-t border-gray-200 pt-4 italic">
          This is a proforma invoice and is not a demand for payment. Prices are valid until the date indicated above.
        </div>

        <div className="mt-16 text-[12px] text-center border-t border-gray-100 pt-4 text-gray-400">
          Email: famcarerehab@gmail.com | Web: https://famcareltd.co.ke
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3 print:hidden flex-wrap">
        <button onClick={handlePrint} className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-900">
          🖨️ Print Proforma
        </button>

        {proforma.status === "pending" && (
          <button
            onClick={handleConvert}
            disabled={converting}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {converting ? "Converting..." : "✅ Convert to Sale"}
          </button>
        )}

        {proforma.status === "converted" && (
          <span className="bg-green-50 border border-green-200 text-green-700 px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center">
            ✅ Already converted to a sale
          </span>
        )}

        <button onClick={() => navigate("/proforma/list")} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-200">
          ← Back
        </button>
      </div>
    </div>
  );
}