import { useEffect, useState } from "react";
import axios from "axios";

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
      const productRes = await axios.get("http://localhost:5003/api/inventory");
      setProducts(productRes.data.filter((p) => p.stock > 0));

      // Get today's sales and summary
      const salesRes = await axios.get("http://localhost:5003/api/sales/today");
      setSummary(salesRes.data.summary);
      setRecentSales(salesRes.data.sales);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 INITIAL LOAD
  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 AUTO-REFRESH EVERY 5 SECONDS
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5003); // refresh every 5 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Update total when product or quantity changes
  useEffect(() => {
    if (selectedProduct) {
      setTotal(selectedProduct.unit_price * quantity);
    } else {
      setTotal(0);
    }
  }, [selectedProduct, quantity]);

  // Handle sale completion
  const handleSale = async () => {
    if (!selectedProduct) return;

    try {
      const res = await axios.post("http://localhost:5003/api/sales", {
        product_id: selectedProduct.id,
        quantity,
      });

      alert(`Sale completed! Total: Ksh ${res.data.total_price}`);
      setSelectedProduct(null);
      setQuantity(1);
      setError("");

      // Refresh products & summary immediately
      fetchData();
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* TODAY'S SUMMARY */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow text-center">
          <h2 className="text-gray-500">Sales</h2>
          <p className="text-2xl font-bold">{summary.total_sales}</p>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <h2 className="text-gray-500">Items Sold</h2>
          <p className="text-2xl font-bold">{summary.items_sold}</p>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <h2 className="text-gray-500">Revenue</h2>
          <p className="text-2xl font-bold">Ksh {summary.revenue}</p>
        </div>
      </div>

      {/* SELLING AREA */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-bold mb-4">Sell Product</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Product select */}
          <div className="flex-1">
            <label className="block text-gray-700">Product</label>
            <select
              className="w-full border p-2 rounded"
              value={selectedProduct?.id || ""}
              onChange={(e) =>
                setSelectedProduct(
                  products.find((p) => p.id === parseInt(e.target.value))
                )
              }
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity input */}
          <div className="flex-1">
            <label className="block text-gray-700">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              className="w-full border p-2 rounded"
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
          </div>

          {/* Unit price & total */}
          <div className="flex-1">
            <p>Unit Price: {selectedProduct?.unit_price || 0}</p>
            <p>Total: {total}</p>
          </div>

          {/* Complete sale button */}
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleSale}
          >
            Complete Sale
          </button>
        </div>
      </div>

      {/* RECENT SALES */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Recent Sales</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id} className="border-b">
                  <td className="px-4 py-2">{sale.product}</td>
                  <td className="px-4 py-2">{sale.quantity}</td>
                  <td className="px-4 py-2">{sale.total_price}</td>
                  <td className="px-4 py-2">
                    {new Date(sale.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}