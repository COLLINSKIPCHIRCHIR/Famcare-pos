import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const ROWS_PER_PAGE = 10;

export default function PurchaseList() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const tableRef = useRef(null);

  useEffect(() => {
    API.get("/purchases")
      .then((r) => setPurchases(r.data))
      .catch(() => console.error("Failed to load purchases"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollTable = (direction) => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  const toggleExpand = async (id) => {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    if (!detail[id]) {
      try {
        const res = await API.get(`/purchases/${id}`);
        setDetail((prev) => ({ ...prev, [id]: res.data }));
      } catch {
        console.error("Failed to load purchase details");
      }
    }
  };

  const filtered = purchases.filter((p) =>
    (p.supplier_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const totalSpend = purchases.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.title}>Purchase History</h2>
            <p style={styles.subtitle}>{purchases.length} purchase{purchases.length !== 1 ? "s" : ""} · Total spend: KES {totalSpend.toLocaleString()}</p>
          </div>
          <button onClick={() => navigate("/purchases/new")} style={styles.addBtn}>+ New Purchase</button>
        </div>

        <input placeholder="Search by supplier name..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.search} />

        {loading ? (
          <div style={styles.center}>Loading purchases...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.center}>{search ? "No purchases match your search." : "No purchases yet."}</div>
        ) : (
          <>
            <div style={styles.list}>
              {paginated.map((p) => (
                <div key={p.id} style={styles.card}>
                  <div style={styles.row} onClick={() => toggleExpand(p.id)}>
                    <div style={styles.avatar}>{(p.supplier_name || "?")[0].toUpperCase()}</div>
                    <div style={styles.info}>
                      <div style={styles.supplierName}>{p.supplier_name || "Unknown Supplier"}</div>
                      <div style={styles.date}>{new Date(p.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div style={styles.amount}>KES {parseFloat(p.total_amount).toLocaleString()}</div>
                    <div style={styles.chevron}>{expanded === p.id ? "▲" : "▼"}</div>
                  </div>

                  {expanded === p.id && (
                    <div style={styles.itemsWrap}>
                      {detail[p.id] ? (
                        detail[p.id].items?.length > 0 ? (
                          <div ref={tableRef} style={{ overflowX: "auto" }}>
                            <table style={{ ...styles.table, minWidth: 480 }}>
                              <thead>
                                <tr>
                                  <th style={styles.th}>Product</th>
                                  <th style={styles.th}>Qty</th>
                                  <th style={styles.th}>Unit Price</th>
                                  <th style={styles.th}>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail[p.id].items.map((item, i) => (
                                  <tr key={i}>
                                    <td style={styles.td}>{item.product_name || `Product #${item.product_id}`}</td>
                                    <td style={styles.td}>{item.quantity}</td>
                                    <td style={styles.td}>KES {parseFloat(item.price).toLocaleString()}</td>
                                    <td style={styles.td}>KES {(item.quantity * parseFloat(item.price)).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p style={{ color: "#aaa", padding: "12px 0" }}>No items found.</p>
                        )
                      ) : (
                        <p style={{ color: "#aaa", padding: "12px 0" }}>Loading items...</p>
                      )}

                      {/* Mobile scroll buttons for expanded table */}
                      {isMobile && detail[p.id]?.items?.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 10 }}>
                          <button onClick={() => scrollTable("left")} style={styles.scrollBtn}>← Scroll Left</button>
                          <button onClick={() => scrollTable("right")} style={styles.scrollBtn}>Scroll Right →</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
              <p style={{ fontSize: 13, color: "#aaa" }}>
                Showing {startIndex + 1}–{Math.min(startIndex + ROWS_PER_PAGE, filtered.length)} of {filtered.length} purchases
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 13, opacity: currentPage === 1 ? 0.3 : 1 }}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: "6px 12px", borderRadius: 6, border: "1px solid", fontSize: 13, cursor: "pointer",
                      background: currentPage === page ? "#2563eb" : "#fff",
                      color: currentPage === page ? "#fff" : "#555",
                      borderColor: currentPage === page ? "#2563eb" : "#ddd",
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 13, opacity: currentPage === totalPages ? 0.3 : 1 }}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f4f6fb", padding: "32px 24px" },
  container: { maxWidth: 860, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: "#1a1a2e" },
  subtitle: { margin: "4px 0 0", color: "#888", fontSize: 14 },
  addBtn: { background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  search: { width: "100%", padding: "10px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, marginBottom: 20, boxSizing: "border-box", outline: "none" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" },
  row: { display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" },
  avatar: { width: 40, height: 40, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  info: { flex: 1 },
  supplierName: { fontWeight: 700, fontSize: 15, color: "#1a1a2e" },
  date: { fontSize: 12, color: "#999", marginTop: 2 },
  amount: { fontWeight: 700, fontSize: 16, color: "#2563eb" },
  chevron: { color: "#bbb", fontSize: 12 },
  itemsWrap: { padding: "0 20px 16px", borderTop: "1px solid #f0f0f0" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 10 },
  th: { padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f0f0f0" },
  td: { padding: "9px 12px", fontSize: 14, color: "#333", borderBottom: "1px solid #f9f9f9" },
  center: { textAlign: "center", color: "#aaa", padding: 60, fontSize: 15 },
  scrollBtn: { padding: "7px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f4f6fb", color: "#555", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};