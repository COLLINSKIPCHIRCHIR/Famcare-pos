// src/pages/reports/CustomerStatement.jsx
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import API from "../../utils/api";
import logo from "../../assets/famcarelogo.png";

// Local-time YYYY-MM-DD (toISOString() is UTC and can show yesterday in Kenya early in the morning)
const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const money = (n) =>
  Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Positive balance = customer owes us (Dr). Negative = they're in credit (Cr).
const balanceLabel = (n) => (n < 0 ? `${money(Math.abs(n))} CR` : money(n));

export default function CustomerStatement() {
  const [searchParams] = useSearchParams();
  const now = new Date();

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(searchParams.get("customer_id") || "");
  const [from, setFrom] = useState(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(toISO(now));
  const [includePaid, setIncludePaid] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef();

  // Customer dropdown
  useEffect(() => {
    API.get("/customers/list")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error(err));
  }, []);

  const fetchStatement = async (id = customerId) => {
    if (!id) return setError("Please select a customer");
    if (from > to) return setError("'From' date must be before 'To' date");
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/reports/customer-statement", {
        params: { customer_id: id, from, to, include_paid: includePaid },
      });
      setData(res.data);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.error || "Failed to generate statement");
    } finally {
      setLoading(false);
    }
  };

  // Arriving from the Customer List "Statement" button → generate straight away
  useEffect(() => {
    if (searchParams.get("customer_id")) fetchStatement(searchParams.get("customer_id"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quick ranges
  const setRange = (kind) => {
    const n = new Date();
    if (kind === "month") {
      setFrom(toISO(new Date(n.getFullYear(), n.getMonth(), 1)));
      setTo(toISO(n));
    } else if (kind === "lastMonth") {
      setFrom(toISO(new Date(n.getFullYear(), n.getMonth() - 1, 1)));
      setTo(toISO(new Date(n.getFullYear(), n.getMonth(), 0)));
    } else if (kind === "year") {
      setFrom(toISO(new Date(n.getFullYear(), 0, 1)));
      setTo(toISO(n));
    }
  };

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (data.customer.name || "customer").replace(/[^a-z0-9]+/gi, "-");
      pdf.save(`Statement-${safeName}-${data.period.from}-to-${data.period.to}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Print only the statement, hide sidebar / filters */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #statement-print, #statement-print * { visibility: visible; }
          #statement-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          @page { margin: 12mm; }
        }
      `}</style>

      {/* ============ FILTERS ============ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Statement</h2>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[220px] flex-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">— Select customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` (${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>

          <button
            onClick={() => fetchStatement()}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Statement"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Quick range:</span>
          <button onClick={() => setRange("month")} className="text-blue-600 hover:underline">This month</button>
          <button onClick={() => setRange("lastMonth")} className="text-blue-600 hover:underline">Last month</button>
          <button onClick={() => setRange("year")} className="text-blue-600 hover:underline">This year</button>

          <label className="flex items-center gap-2 text-gray-600 ml-auto cursor-pointer">
            <input type="checkbox" checked={includePaid} onChange={(e) => setIncludePaid(e.target.checked)} />
            Include sales paid at the counter (cash / M-Pesa / card)
          </label>
        </div>

        {error && (
          <p className="p-3 bg-red-50 text-red-600 rounded-lg mt-4 text-sm font-medium border border-red-100">{error}</p>
        )}
      </div>

      {loading && <p className="text-center py-10 text-gray-400 animate-pulse print:hidden">Calculating...</p>}

      {/* ============ STATEMENT ============ */}
      {!loading && data && (
        <>
          <div className="flex gap-3 mb-4 print:hidden">
            <button onClick={handlePrint}
              className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-900 text-sm">
              🖨️ Print
            </button>
            <button onClick={handleDownload} disabled={downloading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 text-sm disabled:opacity-50">
              {downloading ? "Preparing PDF..." : "⬇️ Download PDF"}
            </button>
          </div>

          <div
            id="statement-print"
            ref={printRef}
            className="bg-white p-10 text-gray-800 leading-tight rounded-xl shadow-sm border border-gray-100"
            style={{ fontFamily: "serif" }}
          >
            {/* Letterhead (same as InvoicePage) */}
            <div className="flex justify-between items-start border-b-2 border-orange-400 pb-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-700">FAM<span className="text-orange-500">CARE</span></h1>
                <p className="text-xs italic text-orange-600 font-semibold">For All Your Needs, We Deliver</p>
                <p className="text-xs font-bold mt-1 uppercase text-gray-500 tracking-widest">REHAB & MEDICAL SUPPLIES</p>
                <img src={logo} alt="Company Logo" className="mt-2 w-24 object-contain" />
              </div>
              <div className="text-right text-sm">
                <h2 className="font-bold text-lg">Famcare Rehab & Medical Supplies Ltd.</h2>
                <p className="font-bold">Nakuru office:</p>
                <p className="font-bold">Highway Towers, 4th floor Room 405</p>
                <p className="font-bold">Nairobi Office:</p>
                <p className="font-bold">Devt Hse 2nd Flr Room 18</p>
                <p className="font-bold">Tel: +254 (0) 773 991 127 / 0726 749 708</p>
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold border-b border-gray-300 inline-block px-4 pb-1">CUSTOMER STATEMENT</h3>
            </div>

            {/* Customer + period */}
            <div className="flex justify-between mb-6 text-sm">
              <div className="space-y-1">
                <p><strong>Customer:</strong> {data.customer.name?.toUpperCase()}</p>
                {data.customer.phone && <p><strong>Phone:</strong> {data.customer.phone}</p>}
                {data.customer.email && <p><strong>Email:</strong> {data.customer.email}</p>}
              </div>
              <div className="text-right space-y-1">
                <p><strong>Period:</strong> {fmtDate(data.period.from)} — {fmtDate(data.period.to)}</p>
                <p><strong>Printed:</strong> {new Date().toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            {/* Summary boxes */}
            <div className="grid grid-cols-4 gap-3 mb-6 text-center">
              {[
                ["Opening Balance", balanceLabel(data.opening_balance), "text-gray-800"],
                ["Total Debits", money(data.total_debit), "text-gray-800"],
                ["Total Credits", money(data.total_credit), "text-green-700"],
                ["Closing Balance", balanceLabel(data.closing_balance), data.closing_balance > 0 ? "text-red-600" : "text-green-700"],
              ].map(([label, value, color]) => (
                <div key={label} className="border border-gray-300 rounded p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                  <p className={`text-base font-bold ${color}`}>KES {value}</p>
                </div>
              ))}
            </div>

            {/* Transactions */}
            <table className="w-full text-sm border-collapse border border-gray-300 mb-4">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-2 border-r border-gray-300 text-left w-24">Date</th>
                  <th className="p-2 border-r border-gray-300 text-left w-28">Type</th>
                  <th className="p-2 border-r border-gray-300 text-left">Reference</th>
                  <th className="p-2 border-r border-gray-300 text-left">Description</th>
                  <th className="p-2 border-r border-gray-300 text-right">Debit</th>
                  <th className="p-2 border-r border-gray-300 text-right">Credit</th>
                  <th className="p-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 bg-gray-50 italic">
                  <td className="p-2 border-r border-gray-200">{fmtDate(data.period.from)}</td>
                  <td className="p-2 border-r border-gray-200" colSpan={5}>Opening balance (brought forward)</td>
                  <td className="p-2 text-right font-semibold">{balanceLabel(data.opening_balance)}</td>
                </tr>

                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400 italic">
                      No transactions in this period.
                    </td>
                  </tr>
                )}

                {data.rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="p-2 border-r border-gray-200 whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td className="p-2 border-r border-gray-200 text-xs font-bold">{r.type}</td>
                    <td className="p-2 border-r border-gray-200">{r.reference}</td>
                    <td className="p-2 border-r border-gray-200">{r.description}</td>
                    <td className="p-2 border-r border-gray-200 text-right">{r.debit ? money(r.debit) : ""}</td>
                    <td className="p-2 border-r border-gray-200 text-right text-green-700">{r.credit ? money(r.credit) : ""}</td>
                    <td className="p-2 text-right font-semibold">{balanceLabel(r.balance)}</td>
                  </tr>
                ))}

                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <td className="p-2" colSpan={4}>TOTALS</td>
                  <td className="p-2 border-l border-gray-300 text-right">{money(data.total_debit)}</td>
                  <td className="p-2 border-l border-gray-300 text-right">{money(data.total_credit)}</td>
                  <td className="p-2 border-l border-gray-300 text-right">{balanceLabel(data.closing_balance)}</td>
                </tr>
              </tbody>
            </table>

            {/* Amount due */}
            <div className="flex justify-end mb-6">
              <div className="border-2 border-gray-700 px-5 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {data.closing_balance < 0 ? "Credit balance in your favour" : "Amount due"}
                </p>
                <p className="text-xl font-bold">KES {money(Math.abs(data.closing_balance))}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Debits are invoices raised. Credits are payments received and credit notes issued.
              Please contact us if you notice any discrepancy.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
