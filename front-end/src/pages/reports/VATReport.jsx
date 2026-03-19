import { useState, useEffect } from "react";
import API from "../../utils/api";

export default function VATReport() {
  const now      = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const today    = now.toISOString().split("T")[0];

  const [from, setFrom]   = useState(firstDay);
  const [to, setTo]       = useState(today);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reports/vat?from=${from}&to=${to}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const fmt = (n) => `KES ${Number(n || 0).toLocaleString()}`;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">VAT Report</h2>

      <div className="flex flex-wrap gap-3 mb-6 items-end">
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
        <button onClick={fetchReport}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm">
          Generate
        </button>
      </div>

      {loading && <p className="text-center py-10 text-gray-400 animate-pulse">Calculating...</p>}

      {!loading && data && (
        <>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            Period: {new Date(data.period.from).toLocaleDateString("en-GB")} — {new Date(data.period.to).toLocaleDateString("en-GB")}
          </p>

          <div className="rounded-xl border border-gray-100 overflow-hidden mb-6">
            {/* Output VAT */}
            <div className="bg-green-50 px-4 py-2">
              <p className="text-xs font-black text-green-600 uppercase tracking-widest">Output VAT (Sales)</p>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="flex justify-between py-3 px-4"><span className="text-gray-600">Gross Sales</span><span className="font-semibold">{fmt(data.gross_sales)}</span></div>
              <div className="flex justify-between py-3 px-4"><span className="text-gray-600">Taxable Sales (ex-VAT)</span><span className="font-semibold">{fmt(data.taxable_sales)}</span></div>
              <div className="flex justify-between py-3 px-4 bg-green-50"><span className="font-bold text-green-700">Output VAT (16%)</span><span className="font-bold text-green-700">{fmt(data.output_vat)}</span></div>
            </div>

            {/* Input VAT */}
            <div className="bg-red-50 px-4 py-2 mt-2">
              <p className="text-xs font-black text-red-500 uppercase tracking-widest">Input VAT (Purchases)</p>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="flex justify-between py-3 px-4"><span className="text-gray-600">Gross Purchases</span><span className="font-semibold">{fmt(data.gross_purchases)}</span></div>
              <div className="flex justify-between py-3 px-4"><span className="text-gray-600">Taxable Purchases (ex-VAT)</span><span className="font-semibold">{fmt(data.taxable_purchases)}</span></div>
              <div className="flex justify-between py-3 px-4 bg-red-50"><span className="font-bold text-red-500">Input VAT (16%)</span><span className="font-bold text-red-500">{fmt(data.input_vat)}</span></div>
            </div>

            {/* VAT Payable */}
            <div className={`flex justify-between py-4 px-4 border-t-2 border-gray-300 ${data.vat_payable >= 0 ? "bg-orange-50" : "bg-green-50"}`}>
              <span className="font-black text-lg text-gray-800">VAT PAYABLE TO KRA</span>
              <span className={`font-black text-lg ${data.vat_payable >= 0 ? "text-orange-600" : "text-green-600"}`}>
                {fmt(data.vat_payable)}
                {data.vat_payable < 0 && " (Credit)"}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 italic mb-4">
            * Use these figures to complete your monthly VAT return on iTax.
          </p>

          <button onClick={() => window.print()}
            className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-900">
            🖨️ Print VAT Report
          </button>
        </>
      )}
    </div>
  );
}