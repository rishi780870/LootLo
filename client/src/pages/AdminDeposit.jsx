import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";

function AdminDeposit() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending"); // pending | history
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (!auth) { navigate("/admin-login"); return; }
    loadRequests();
  }, [navigate]);

  const loadRequests = async () => {
    try {
      const snapshot = await getDocs(collection(db, "depositRequests"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const approveDeposit = async (request) => {
    setActionLoading(request.id + "_approve");
    try {
      const userRef = doc(db, "users", request.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) { alert("User Not Found"); return; }
      const userData = userSnap.data();
      await updateDoc(userRef, { balance: (userData.balance || 0) + request.amount });
      await updateDoc(doc(db, "depositRequests", request.id), { status: "approved" });
      alert("Deposit Approved ✅");
      loadRequests();
    } catch (e) {
      console.log(e);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectDeposit = async (request) => {
    setActionLoading(request.id + "_reject");
    try {
      await updateDoc(doc(db, "depositRequests", request.id), { status: "rejected" });
      alert("Deposit Rejected ❌");
      loadRequests();
    } catch (e) {
      console.log(e);
    } finally {
      setActionLoading(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");
  const displayed = tab === "pending" ? pending : history;

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow}></div>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate("/admin-dashboard")} className="backBtn">← Back</button>
          <h1 style={styles.title}>💳 Deposit Requests</h1>
          <button onClick={loadRequests} className="refreshBtn">🔄</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabRow}>
          <button
            onClick={() => setTab("pending")}
            className={tab === "pending" ? "tabActive" : "tab"}
          >
            ⏳ Pending
            {pending.length > 0 && <span className="tabBadge">{pending.length}</span>}
          </button>
          <button
            onClick={() => setTab("history")}
            className={tab === "history" ? "tabActive" : "tab"}
          >
            📜 History
            <span className="tabBadge" style={{ background: "#475569" }}>{history.length}</span>
          </button>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48 }}>{tab === "pending" ? "🎉" : "📭"}</div>
            <p style={{ color: "#64748b", marginTop: 12 }}>
              {tab === "pending" ? "No pending requests!" : "No history found"}
            </p>
          </div>
        ) : (
          displayed.map((item) => (
            <div key={item.id} style={styles.card} className="reqCard">
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardName}>👤 {item.name}</h3>
                  <p style={styles.cardEmail}>📧 {item.email}</p>
                </div>
                <div style={styles.amountBadge}>₹{item.amount?.toLocaleString()}</div>
              </div>

              <div style={styles.cardDetails}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>UTR Number</span>
                  <span style={styles.detailValue}>🧾 {item.utr}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Date</span>
                  <span style={styles.detailValue}>
                    📅 {item.createdAt?.toDate?.()?.toLocaleDateString?.() || "N/A"}
                  </span>
                </div>
              </div>

              {tab === "pending" ? (
                <div style={styles.btnRow}>
                  <button
                    onClick={() => approveDeposit(item)}
                    disabled={!!actionLoading}
                    className="approveBtn"
                  >
                    {actionLoading === item.id + "_approve" ? "..." : "✅ Approve"}
                  </button>
                  <button
                    onClick={() => rejectDeposit(item)}
                    disabled={!!actionLoading}
                    className="rejectBtn"
                  >
                    {actionLoading === item.id + "_reject" ? "..." : "❌ Reject"}
                  </button>
                </div>
              ) : (
                <div style={{
                  ...styles.statusBadge,
                  background: item.status === "approved" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  color: item.status === "approved" ? "#10b981" : "#ef4444",
                  border: `1px solid ${item.status === "approved" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}>
                  {item.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#020617", color: "white",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  glow: {
    position: "fixed", top: -100, right: "20%", width: 300, height: 300,
    background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  container: { maxWidth: 700, margin: "0 auto", padding: "28px 20px 60px" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 24, gap: 12,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  tabRow: { display: "flex", gap: 10, marginBottom: 20 },
  card: {
    background: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18, padding: "20px 22px", marginBottom: 14,
    backdropFilter: "blur(10px)", transition: "all 0.2s",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 14,
  },
  cardName: { margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" },
  cardEmail: { margin: 0, color: "#64748b", fontSize: 13 },
  amountBadge: {
    background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
    color: "#10b981", padding: "6px 14px", borderRadius: 20,
    fontWeight: 800, fontSize: 18,
  },
  cardDetails: { display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" },
  detailItem: { display: "flex", flexDirection: "column", gap: 2 },
  detailLabel: { color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  detailValue: { color: "#94a3b8", fontSize: 14, fontWeight: 500 },
  btnRow: { display: "flex", gap: 10 },
  statusBadge: {
    display: "inline-block", padding: "6px 14px",
    borderRadius: 20, fontSize: 13, fontWeight: 700,
  },
  emptyState: {
    textAlign: "center", padding: "60px 20px", color: "#64748b",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .backBtn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8; padding: 9px 16px; border-radius: 10px;
    cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;
  }
  .backBtn:hover { background: rgba(255,255,255,0.1); color: white; }
  .refreshBtn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8; padding: 9px 14px; border-radius: 10px;
    cursor: pointer; font-size: 16px; transition: all 0.2s;
  }
  .refreshBtn:hover { background: rgba(255,255,255,0.1); }
  .tab {
    flex: 1; padding: 10px; border-radius: 12px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s;
  }
  .tab:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }
  .tabActive {
    flex: 1; padding: 10px; border-radius: 12px;
    background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3);
    color: #10b981; font-size: 14px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .tabBadge {
    background: #ef4444; color: white;
    font-size: 11px; font-weight: 700;
    padding: 2px 7px; border-radius: 20px;
  }
  .reqCard:hover {
    border-color: rgba(16,185,129,0.25);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  }
  .approveBtn {
    flex: 1; padding: 11px;
    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35);
    color: #10b981; border-radius: 10px; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .approveBtn:hover:not(:disabled) { background: rgba(16,185,129,0.25); }
  .approveBtn:disabled { opacity: 0.5; cursor: not-allowed; }
  .rejectBtn {
    flex: 1; padding: 11px;
    background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);
    color: #ef4444; border-radius: 10px; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .rejectBtn:hover:not(:disabled) { background: rgba(239,68,68,0.22); }
  .rejectBtn:disabled { opacity: 0.5; cursor: not-allowed; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 32px; height: 32px; margin: 0 auto;
    border: 3px solid rgba(16,185,129,0.2); border-top-color: #10b981;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
`;

export default AdminDeposit;