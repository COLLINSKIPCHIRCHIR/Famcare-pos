import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const SIZES = ["N/A", "Extra Small", "Small", "Medium", "Large", "Extra Large", "One Size", "XXL", "XXXL"];

export default function PurchaseAdd() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([{ product_id: "", size: "", quantity: 1, price: "", expiry_date: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppRes, invRes] = await Promise.all([
          API.get("/suppliers"),
          API.get("/inventory/list")
        ]);
        setSuppliers(suppRes.data);
        setInventory(invRes.data);
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load suppliers or inventory.");
      }
    };
    fetchData();
  }, []);

  const addItem = () => setItems([...items, { product_id: "", size: "", quantity: 1, price: "", expiry_date: "" }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    if (field === "product_id") {
      const found = inventory.find((p) => String(p.id) === String(value));
      if (found) {
        updated[i].price = found.buying_price || "";
        updated[i].size = found.size || "";
        updated[i].expiry_date = ""; // always clear expiry so user enters new one
      }
    }
    setItems(updated);
  };

  // Format product label for dropdown
  const getProductLabel = (p) => {
    let label = p.name;
    if (p.size && p.size !== "N/A") label += ` (${p.size})`;
    if (p.expiry_date) {
      const exp = new Date(p.expiry_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
      label += ` — Exp: ${exp}`;
    }
    return label;
  };

  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!supplierId) return setError("Please select a supplier.");
    if (items.some((i) => !i.product_id || !i.price || !i.quantity)) return setError("Please fill in all item fields.");
    setLoading(true);
    try {
      await API.post("/purchases", {
        supplier_id: supplierId,
        items: items.map((i) => ({
          product_id: parseInt(i.product_id),
          quantity: parseInt(i.quantity),
          price: parseFloat(i.price),
          size: i.size || "N/A",
          expiry_date: i.expiry_date || null,
        })),
      });
      navigate("/purchases");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save purchase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <button onClick={() => navigate("/purchases")} style={styles.backBtn}>← Back</button>
          <h2 style={styles.title}>New Purchase</h2>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.card}>
            <label style={styles.label}>Select Supplier <span style={styles.req}>*</span></label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={styles.select} required>
              <option value="">-- Choose a supplier --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={styles.card}>
            <div style={styles.itemsHeader}>
              <span style={styles.label}>Purchase Items</span>
              <button type="button" onClick={addItem} style={styles.addItemBtn}>+ Add Item</button>
            </div>

            <div style={styles.colHeaders}>
              <span style={{ flex: 2 }}>Product</span>
              <span style={{ flex: 1 }}>Size (Optional)</span>
              <span style={{ flex: 1 }}>New Expiry Date</span>
              <span style={{ flex: 1 }}>Qty</span>
              <span style={{ flex: 1 }}>Unit Price (KES)</span>
              <span style={{ flex: 1 }}>Subtotal</span>
              <span style={{ width: 32 }}></span>
            </div>

            {items.map((item, i) => (
              <div key={i} style={styles.itemRow}>
                {/* Product dropdown */}
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(i, "product_id", e.target.value)}
                  style={{ ...styles.input, flex: 2 }}
                  required
                >
                  <option value="">-- Select product --</option>
                  {inventory.map((p) => (
                    <option key={p.id} value={p.id}>{getProductLabel(p)}</option>
                  ))}
                </select>

                {/* Size — optional */}
                <select
                  value={item.size}
                  onChange={(e) => updateItem(i, "size", e.target.value)}
                  style={{ ...styles.input, flex: 1, color: item.size ? "#1a1a2e" : "#aaa" }}
                >
                  <option value="">-- Size --</option>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Expiry date — optional */}
                <input
                  type="date"
                  value={item.expiry_date}
                  onChange={(e) => updateItem(i, "expiry_date", e.target.value)}
                  style={{ ...styles.input, flex: 1, color: item.expiry_date ? "#1a1a2e" : "#aaa" }}
                  placeholder="Optional"
                />

                <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} style={{ ...styles.input, flex: 1 }} required />
                <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(i, "price", e.target.value)} placeholder="0.00" style={{ ...styles.input, flex: 1 }} required />
                <div style={{ ...styles.subtotal, flex: 1 }}>KES {((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toLocaleString()}</div>
                {items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={styles.removeBtn}>✕</button>}
              </div>
            ))}

            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total Amount</span>
              <span style={styles.totalValue}>KES {total.toLocaleString()}</span>
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Saving Purchase..." : "Confirm Purchase"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f4f6fb", padding: "32px 24px" },
  container: { maxWidth: 900, margin: "0 auto" },
  topBar: { display: "flex", alignItems: "center", gap: 16, marginBottom: 24 },
  backBtn: { background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14, color: "#555" },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" },
  error: { background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 8, padding: "10px 14px", color: "#cc0000", marginBottom: 20, fontSize: 14 },
  card: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: 24, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 10 },
  req: { color: "#e53e3e" },
  select: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", background: "#fff", cursor: "pointer" },
  itemsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  addItemBtn: { background: "#f0f4ff", color: "#2563eb", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  colHeaders: { display: "flex", gap: 10, padding: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f0f0f0", marginBottom: 10 },
  itemRow: { display: "flex", gap: 10, alignItems: "center", marginBottom: 10 },
  input: { padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  subtotal: { padding: "9px 12px", background: "#f8faff", borderRadius: 8, fontSize: 14, color: "#2563eb", fontWeight: 600, textAlign: "right" },
  removeBtn: { background: "#fff0f0", color: "#e53e3e", border: "none", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #f0f0f0", paddingTop: 16, marginTop: 8 },
  totalLabel: { fontSize: 15, fontWeight: 700, color: "#444" },
  totalValue: { fontSize: 20, fontWeight: 800, color: "#1a1a2e" },
  submitBtn: { width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer" },
};