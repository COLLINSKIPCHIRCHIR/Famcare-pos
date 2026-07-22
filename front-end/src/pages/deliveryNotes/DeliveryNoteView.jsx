import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import API from "../../utils/api";
import logo from "../../assets/famcarelogo.png";

export default function DeliveryNoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [dn, setDn]         = useState(null);
  const [items, setItems]   = useState([]);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    API.get(`/delivery-notes/${id}`)
      .then((res) => {
        setDn(res.data.delivery_note);
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

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`DeliveryNote-${dn.delivery_number || id}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const markDelivered = async () => {
    setUpdating(true);
    try {
      await API.patch(`/delivery-notes/${id}/status`, { status: "delivered" });
      setDn({ ...dn, status: "delivered" });
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (!dn) return <p className="p-6 text-center text-gray-400 animate-pulse">Loading delivery note...</p>;

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
            <p className="font-bold">Tel: +254 (0) 773 991 127 / 0726 749 708</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold border-b border-gray-300 inline-block px-4 pb-1">DELIVERY NOTE</h3>
        </div>

        {/* Meta */}
        <div className="flex justify-between mb-8 text-sm">
          <div className="space-y-1">
            <p><strong>Customer:</strong> {dn.customer_name?.toUpperCase() || "WALK-IN CUSTOMER"}</p>
            <p><strong>Phone:</strong> {dn.customer_phone || "_"}</p>
            <p><strong>Delivery Address:</strong> {dn.delivery_address || "—"}</p>
            <p><strong>Date:</strong> {new Date(dn.created_at).toLocaleDateString("en-GB")}</p>
          </div>
          <div className="text-right space-y-1">
            <p><strong>DN No:</strong> {dn.delivery_number}</p>
            <p><strong>Invoice Ref:</strong> {dn.invoice_number || "—"}</p>
            <p><strong>Status:</strong>{" "}
              <span className={`font-bold capitalize ${dn.status === "delivered" ? "text-green-600" : "text-yellow-600"}`}>
                {dn.status}
              </span>
            </p>
          </div>
        </div>

        {/* Items Table — No prices on delivery note */}
        <table className="w-full text-sm mb-6 border-collapse border border-gray-300">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="p-2 border-r border-gray-300 text-center w-16">#</th>
              <th className="p-2 border-r border-gray-300 text-left">Description</th>
              <th className="p-2 border-r border-gray-300 text-center">Size/Unit</th>
              <th className="p-2 text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="h-10 border-b border-gray-200">
                <td className="p-2 border-r border-gray-300 text-center">{idx + 1}</td>
                <td className="p-2 border-r border-gray-300">{item.product_name}</td>
                <td className="p-2 border-r border-gray-300 text-center">{item.size || "Pcs"}</td>
                <td className="p-2 text-center font-bold">{item.quantity}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (
              <tr key={`empty-${i}`} className="h-10 border-b border-gray-100">
                <td className="border-r border-gray-300"></td>
                <td className="border-r border-gray-300"></td>
                <td className="border-r border-gray-300"></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {dn.notes && (
          <p className="text-sm text-gray-600 italic mb-6"><strong>Notes:</strong> {dn.notes}</p>
        )}

        {/* Signatures */}
        <div className="flex justify-between text-sm mt-12 pt-8">
          <div className="w-full space-y-4">
            <p>Delivered by: ________________________ Date: ___________ Signature: ___________</p>
            <p>Received by: _________________________ Date: ___________ Signature: ___________</p>
          </div>
        </div>

        <div className="mt-16 text-[12px] text-center border-t border-gray-100 pt-4 text-gray-400">
          Email: famcarerehab@gmail.com | Web: https://famcareltd.co.ke | Tel: 0726 749 708
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3 print:hidden flex-wrap">
        <button onClick={handlePrint} className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-900">
          🖨️ Print Delivery Note
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50"
        >
          {downloading ? "Preparing..." : "⬇️ Download PDF"}
        </button>

        {dn.status === "pending" && (
          <button
            onClick={markDelivered}
            disabled={updating}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {updating ? "Updating..." : "✅ Mark as Delivered"}
          </button>
        )}

        {dn.status === "delivered" && (
          <span className="bg-green-50 border border-green-200 text-green-700 px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center">
            ✅ Delivered
          </span>
        )}

        <button onClick={() => navigate("/delivery-notes/list")} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-200">
          ← Back
        </button>
      </div>
    </div>
  );
}