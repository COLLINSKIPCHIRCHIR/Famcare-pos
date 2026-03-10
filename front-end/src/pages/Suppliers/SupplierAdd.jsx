import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api/suppliers";

export default function SupplierAdd() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      axios.get(`${API}/${id}`).then((res) => setForm(res.data)).catch(() => setError("Failed to load supplier"));
    }
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Supplier name is required.");
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/${id}`, form);
      } else {
        await axios.post(API, form);
      }
      navigate("/suppliers");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save supplier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate("/suppliers")} style={styles.backBtn}>← Back</button>
          <h2 style={styles.title}>{isEdit ? "Edit Supplier" : "Add New Supplier"}</h2>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Supplier Name <span style={styles.req}>*</span></label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Bidco Africa" style={styles.input} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 0712 345 678" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="e.g. supplier@company.com" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Physical Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} placeholder="e.g. Industrial Area, Nairobi" style={{ ...styles.input, height: 80, resize: "vertical" }} />
          </div>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update Supplier" : "Save Supplier"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px" },
  card: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.09)", padding: 36, width: "100%", maxWidth: 520 },
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 28 },
  backBtn: { background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14, color: "#555" },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a2e" },
  error: { background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 8, padding: "10px 14px", color: "#cc0000", marginBottom: 20, fontSize: 14 },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#444" },
  req: { color: "#e53e3e" },
  input: { padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  submitBtn: { background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 },
};