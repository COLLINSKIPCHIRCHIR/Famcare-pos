// src/pages/sales/Sales.jsx
import { useEffect, useState } from "react";
import API from "../../utils/api";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [total, setTotal] = useState(0);

  const [summary, setSummary] = useState({
    total_sales: 0,
    items_sold: 0,
    revenue: 0,
  });

  const [recentSales, setRecentSales] = useState([]);
  const [error, setError] = useState("");

  // Fetch products and today's sales
  const fetchData = async () => {
    try {
      // Get inventory products with stock > 0
      const productRes = await API.get("/inventory");
      setProducts(productRes.data.filter((p) => p.stock > 0));

      // Get today's sales and summary
      const salesRes = await API.get("/sales/today");
      setSummary(salesRes.data.summary);
      setRecentSales(salesRes.data.sales);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // AUTO-REFRESH EVERY 5 SECONDS
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5003); 
    return () => clearInterval(interval);
  }, []);

  // Update total calculation
  useEffect(() => {
    if (selectedProduct) {
      setTotal(selectedProduct.unit_price * quantity);
    } else {
      setTotal(0);
    }
  }, [selectedProduct, quantity]);

  const handleSale = async () => {
    if (!selectedProduct) return;

    try {
      const res = await API.post("/sales", {
        product_id: selectedProduct.id,
        quantity,
      });

      // Simple alert as per original logic, but styled UI handles errors
      alert(`Sale completed! Total: KES ${res.data.total_price}`);
      setSelectedProduct(null);
      setQuantity(1);
      setError("");
      fetchData();
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Transaction failed. Please check stock.");
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Point of Sale</h1>

      {/* TODAY'S SUMMARY CARDS */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Sales</span>
          <p className="text-3xl font-black text-gray-900">{summary.total_sales}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Items Sold</span>
          <p className="text-3xl font-black text-gray-900">{summary.items_sold}</p>
        </div>
        <div className="bg-blue-600 p-6 rounded-xl shadow-md flex flex-col items-center text-white">
          <span className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-1">Today's Revenue</span>
          <p className="text-3xl font-black italic">KES {Number(summary.revenue).toLocaleString()}</p>
        </div>
      </div>

      {/* SELLING AREA */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-4">New Transaction</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
          {/* Product select */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Select Product</label>
            <select
              className="w-full border-2 border-gray-100 p-3 rounded-xl text-sm focus:border-blue-500 focus:ring-0 transition-all outline-none bg-gray-50 font-medium"
              value={selectedProduct?.id || ""}
              onChange={(e) =>
                setSelectedProduct(products.find((p) => p.id === parseInt(e.target.value)))
              }
            >
              <option value="">Choose a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — {product.stock} in stock
                </option>
              ))}
            </select>
          </div>

          {/* Quantity input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              className="w-full border-2 border-gray-100 p-3 rounded-xl text-sm focus:border-blue-500 outline-none bg-gray-50 font-bold"
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Complete sale button */}
          <button
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleSale}
            disabled={!selectedProduct}
          >
            Confirm Sale
          </button>
        </div>

        {/* Dynamic Pricing Info */}
        {selectedProduct && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-bold text-blue-700 uppercase">Checkout Details:</span>
            <div className="text-right">
              <p className="text-xs text-blue-400 font-bold uppercase">KES {selectedProduct.unit_price} x {quantity}</p>
              <p className="text-xl font-black text-blue-800">TOTAL: KES {total.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* RECENT SALES TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
           <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Recent Activity</h2>
           <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                <th className="p-4">Product</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-gray-400 italic">No transactions recorded today.</td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{sale.product}</td>
                    <td className="p-4 text-sm font-medium text-gray-500">{sale.quantity}</td>
                    <td className="p-4 font-black text-gray-900">KES {Number(sale.total_price).toLocaleString()}</td>
                    <td className="p-4 text-right text-xs font-bold text-gray-400 uppercase">
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}