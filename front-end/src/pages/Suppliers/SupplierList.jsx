import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api/suppliers";

export default function SuppliersList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setSuppliers(res.data);
    } catch {
      console.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setDeleteId(null);
      fetchSuppliers();
    } catch {
      alert("Failed to delete supplier");
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").includes(search) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.title}>Suppliers</h2>
            <p style={styles.subtitle}>{suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} registered</p>
          </div>
          <button onClick={() => navigate("/suppliers/add")} style={styles.addBtn}>+ Add Supplier</button>
        </div>

        <input placeholder="Search by name, phone or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.search} />

        <div style={styles.tableWrap}>
          {loading ? (
            <div style={styles.center}>Loading suppliers...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.center}>{search ? "No suppliers match your search." : "No suppliers yet. Add your first one!"}</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Address</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: "#1a1a2e" }}>{s.name}</td>
                    <td style={styles.td}>{s.phone || <span style={styles.empty}>—</span>}</td>
                    <td style={styles.td}>{s.email || <span style={styles.empty}>—</span>}</td>
                    <td style={styles.td}>{s.address || <span style={styles.empty}>—</span>}</td>
                    <td style={styles.td}>
                      <button onClick={() => navigate(`/suppliers/edit/${s.id}`)} style={styles.editBtn}>Edit</button>
                      <button onClick={() => setDeleteId(s.id)} style={styles.deleteBtn}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deleteId && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0 }}>Delete Supplier?</h3>
            <p style={{ color: "#555" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteId(null)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={styles.confirmBtn}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f4f6fb", padding: "32px 24px" },
  container: { maxWidth: 960, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: "#1a1a2e" },
  subtitle: { margin: "4px 0 0", color: "#888", fontSize: 14 },
  addBtn: { background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  search: { width: "100%", padding: "10px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, marginBottom: 20, boxSizing: "border-box", outline: "none" },
  tableWrap: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f8faff" },
  th: { padding: "13px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  td: { padding: "13px 16px", fontSize: 14, color: "#333", borderTop: "1px solid #f0f0f0" },
  trEven: { background: "#fff" },
  trOdd: { background: "#fafbff" },
  empty: { color: "#ccc" },
  editBtn: { background: "#f0f4ff", color: "#2563eb", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: "pointer", marginRight: 8, fontWeight: 600 },
  deleteBtn: { background: "#fff0f0", color: "#e53e3e", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  center: { padding: 48, textAlign: "center", color: "#999", fontSize: 15 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal: { background: "#fff", borderRadius: 12, padding: 28, width: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" },
  cancelBtn: { background: "#f4f4f4", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 14 },
  confirmBtn: { background: "#e53e3e", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600 },
};