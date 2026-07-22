// src/pages/sales/NewSale.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import API from "../../utils/api";
import { subscribeToInventoryUpdates } from "../../utils/inventoryChannel";

const INVENTORY_POLL_INTERVAL_MS = 8000; // background refresh every 8s

export default function NewSale() {
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [expiryWarning, setExpiryWarning] = useState("");
  const [stockJustUpdated, setStockJustUpdated] = useState(false);

  // Keep the latest cart in a ref so the polling/broadcast effect (which
  // only runs once on mount) can safely re-sync cart quantities against
  // fresh stock without needing `cart` in its dependency array.
  const cartRef = useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  // Fetches the current inventory list only — never touches the cart.
  const refreshInventory = useCallback(async () => {
    try {
      const res = await API.get("/inventory/list");
      setInventory(res.data || []);
      setStockJustUpdated(true);
      setTimeout(() => setStockJustUpdated(false), 2000);
    } catch (err) {
      console.error("Error refreshing inventory", err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inv, cust] = await Promise.all([
          API.get("/inventory/list"),
          API.get("/customers/list"),
        ]);
        setInventory(inv.data || []);
        setCustomers(cust.data || []);
      } catch (err) {
        console.error("Error loading data", err);
      }
    };
    fetchData();
  }, []);

  // Background polling: catches stock changes made from ANY device/tab.
  useEffect(() => {
    const interval = setInterval(refreshInventory, INVENTORY_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshInventory]);

  // Instant refresh: catches stock changes made from another tab in the
  // SAME browser (e.g. admin editing InventoryList.jsx) without waiting
  // for the next poll.
  useEffect(() => {
    const unsubscribe = subscribeToInventoryUpdates(refreshInventory);
    return unsubscribe;
  }, [refreshInventory]);

  // Check expiry status of a product (logic remains untouched)
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { status: "expired", daysLeft };
    if (daysLeft <= 30) return { status: "near", daysLeft };
    return { status: "ok", daysLeft };
  };

  const handleAddToCart = () => {
    setExpiryWarning("");
    if (!selectedItem) return alert("Select a product");
    const item = inventory.find((i) => i.id === parseInt(selectedItem));
    if (!item) return;

    const expiry = getExpiryStatus(item.expiry_date);
    if (expiry) {
      if (expiry.status === "expired") {
        setExpiryWarning(`❌ "${item.name}" has expired and cannot be sold. Please remove it from stock.`);
        return; 
      }
      if (expiry.status === "near") {
        setExpiryWarning(`⚠️ Warning: "${item.name}" expires in ${expiry.daysLeft} day(s). Proceed with caution.`);
      }
    }

    if (parseInt(quantity) > item.quantity) {
      return alert(`Not enough stock. Only ${item.quantity} units available.`);
    }

    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.id === item.id ? { ...c, quantity: c.quantity + parseInt(quantity) } : c
      ));
    } else {
      setCart([...cart, {
        id: item.id,
        product_id: item.id,
        name: item.name,
        price: item.selling_price,
        quantity: parseInt(quantity),
        expiry_date: item.expiry_date || null,
      }]);
    }
    setSelectedItem("");
    setQuantity(1);
  };

  const handleProductChange = (e) => {
    setExpiryWarning("");
    setSelectedItem(e.target.value);

    const item = inventory.find((i) => i.id === parseInt(e.target.value));
    if (item) {
      const expiry = getExpiryStatus(item.expiry_date);
      if (expiry?.status === "expired") {
        setExpiryWarning(`❌ "${item.name}" has expired and cannot be sold.`);
      } else if (expiry?.status === "near") {
        setExpiryWarning(`⚠️ "${item.name}" expires in ${expiry.daysLeft} day(s).`);
      }
    }
  };

  const removeItem = (id) => setCart(cart.filter((item) => item.id !== id));

  const updateQty = (id, val) => {
    const newQty = parseInt(val);
    if (!newQty || newQty < 1) return;

    const stockItem = inventory.find((i) => i.id === id);
    if (stockItem && newQty > stockItem.quantity) {
      alert(`Only ${stockItem.quantity} unit(s) of "${stockItem.name}" are in stock.`);
      return;
    }

    setCart(cart.map((c) => (c.id === id ? { ...c, quantity: newQty } : c)));
  };

  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return alert("Cart is empty");

    for (const cartItem of cart) {
      const expiry = getExpiryStatus(cartItem.expiry_date);
      if (expiry?.status === "expired") {
        return alert(`❌ Cannot complete sale. "${cartItem.name}" in your cart has expired. Please remove it.`);
      }
    }

    setLoading(true);
    try {
      // API utility handles headers/token and baseURL automatically
      const res = await API.post("/sales/complete", {
        cart,
        customer_id: customerId || null,
        payment_method: paymentMethod,
        total,
      });

      const invNum = res.data.invoice_number;
      setInvoiceNumber(invNum);
      alert(`✅ Sale Completed!\nInvoice Number: ${invNum}`);

      setCart([]);
      setCustomerId("");
      setPaymentMethod("cash");
      setExpiryWarning("");
      refreshInventory(); // stock just changed because of this sale too
    } catch (err) {
      console.error(err);
      alert("Sale failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">New Sale</h2>
        <div className="flex items-center gap-2">
          {stockJustUpdated && (
            <span className="text-xs text-green-600 font-semibold animate-pulse">
              ✓ Stock updated
            </span>
          )}
          <button
            onClick={refreshInventory}
            title="Refresh stock now"
            className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded px-2 py-1 font-semibold"
          >
            🔄 Refresh Stock
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-bold mb-1">
          Select Customer <span className="text-red-500">*</span>
        </label>
        <select
          className="border p-2 rounded w-full"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">🚶 Walk-in Customer</option>  {/* ← empty string = null */}
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-bold mb-1">Select Product</label>
        <select
          className="border p-2 rounded w-full"
          value={selectedItem}
          onChange={handleProductChange}
        >
          <option value="">Select product</option>
          {inventory.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} {item.size && item.size !== "N/A" ? `- ${item.size}` : ""} — KES {item.selling_price} (Stock: {item.quantity})
            </option>
          ))}
        </select>
      </div>

      {expiryWarning && (
        <div className={`px-4 py-3 rounded mb-4 font-medium text-sm border ${
          expiryWarning.startsWith("❌")
            ? "bg-red-50 border-red-300 text-red-700"
            : "bg-yellow-50 border-yellow-300 text-yellow-700"
        }`}>
          {expiryWarning}
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <label className="block font-bold mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            className="border p-2 rounded w-full"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAddToCart}
            className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700"
          >
            + Add to Cart
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-2">Cart</h3>
        {cart.length === 0 ? (
          <p className="text-gray-400 text-sm border rounded p-4 text-center">No items in cart yet.</p>
        ) : (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-center">Remove</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      {item.name}
                      {item.expiry_date && (() => {
                        const expiry = getExpiryStatus(item.expiry_date);
                        if (expiry?.status === "near") {
                          return (
                            <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-semibold">
                              Exp. in {expiry.daysLeft}d
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="1"
                        className="border rounded w-16 text-center p-1"
                        value={item.quantity}
                        onChange={(e) => updateQty(item.id, e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-right">KES {Number(item.price).toLocaleString()}</td>
                    <td className="p-3 text-right font-semibold">
                      KES {(item.quantity * item.price).toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-lg"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-bold mb-1">Payment Method</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
          <option value="card">Card</option>
          <option value="insurance">Insurance</option>
          <option value="credit">Credit</option>
        </select>
      </div>

      <div className="flex justify-between items-center p-4 bg-gray-50 rounded border mt-2">
        <span className="text-lg font-bold">Total Amount</span>
        <span className="text-2xl font-bold text-green-600">KES {total.toLocaleString()}</span>
      </div>

      <button
        onClick={handleCompleteSale}
        disabled={loading}
        className="mt-5 w-full bg-green-600 text-white py-3 rounded font-bold text-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "✅ Complete Sale"}
      </button>

      {invoiceNumber && (
        <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
          <strong>✅ Sale Complete! Invoice Number:</strong> #{String(invoiceNumber).padStart(5, "0")}
        </div>
      )}
    </div>
  );
}