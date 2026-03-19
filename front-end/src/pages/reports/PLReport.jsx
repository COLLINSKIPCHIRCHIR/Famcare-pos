import { useState, useEffect } from "react";
import API from "../../utils/api";

export default function PLReport() {
  const now   = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const today    = now.toISOString().split("T")[0];

  const [from, setFrom]   = useState(firstDay);
  const [to, setTo]       = useState(today);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reports/pl?from=${from}&to=${to}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const fmt = (n) => `KES ${Number(n || 0).toLocaleString()}`;

  const Row = ({ label, value, bold, color, border }) => (
    <div className={`flex justify-between py-3 px-4 ${border ? "border-t-2 border-gray-300" : "border-b border-gray-50"} ${bold ? "font-bold" : ""}`}>
      <span className="text-gray-700">{label}</span>
      <span className={color || "text-gray-800"}>{fmt(value)}</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Profit & Loss Report</h2>

      {/* Date Filter */}
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
          Generate Report
        </button>
      </div>

      {loading && <p className="text-center py-10 text-gray-400 animate-pulse">Calculating...</p>}

      {!loading && data && (
        <>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            Period: {new Date(data.period.from).toLocaleDateString("en-GB")} — {new Date(data.period.to).toLocaleDateString("en-GB")}
          </p>

          <div className="rounded-xl border border-gray-100 overflow-hidden mb-6">
            {/* Revenue */}
            <div className="bg-gray-50 px-4 py-2">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Revenue</p>
            </div>
            <Row label="Total Sales" value={data.revenue} color="text-green-600" />
            <Row label="Cost of Goods Sold (COGS)" value={data.cogs} color="text-red-500" />
            <Row label="Gross Profit" value={data.gross_profit}
              bold color={data.gross_profit >= 0 ? "text-green-700" : "text-red-600"} border />

            {/* Expenses */}
            <div className="bg-gray-50 px-4 py-2 mt-2">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Expenses</p>
            </div>
            {data.expenses_by_category.map((cat) => (
              <Row key={cat.category} label={cat.category || "Uncategorized"} value={cat.amount} color="text-red-500" />
            ))}
            <Row label="Total Expenses" value={data.total_expenses} bold color="text-red-600" border />

            {/* Net Profit */}
            <div className={`flex justify-between py-4 px-4 border-t-2 border-gray-300 ${data.net_profit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <span className="font-black text-lg text-gray-800">NET PROFIT</span>
              <span className={`font-black text-lg ${data.net_profit >= 0 ? "text-green-700" : "text-red-600"}`}>
                {fmt(data.net_profit)}
                {data.net_profit < 0 && " (Loss)"}
              </span>
            </div>
          </div>

          <button onClick={() => window.print()}
            className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-900">
            🖨️ Print Report
          </button>
        </>
      )}
    </div>
  );
}