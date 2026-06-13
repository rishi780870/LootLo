import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function LoginHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      // Fixed: proper where query, no client-side filter
      const q = query(collection(db, "loginHistory"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.loginTime?.seconds || 0) - (a.loginTime?.seconds || 0));
      setHistory(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow}></div>
      <div style={styles.container}>

        <div style={styles.header}>
          <button onClick={() => navigate("/history")} className="backBtn">← Back</button>
          <h1 style={styles.title}>🔐 Login History</h1>
          <span></span>
        </div>

        {!loading && history.length > 0 && (
          <div style={styles.totalBadge}>
            🔐 {history.length} total logins recorded
          </div>
        )}

        {loading ? (
          <div style={styles.center}>
            <div className="spinner"></div>
            <p style={{ marginTop: 14, color: "#64748b" }}>Loading...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={styles.center}>
            <div style={{ fontSize: 48 }}>🔐</div>
            <p style={{ color: "#64748b", marginTop: 12 }}>No login history found</p>
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={item.id} style={styles.card} className="hCard">
              <div style={styles.cardRow}>
                <div style={styles.indexBadge}>#{history.length - idx}</div>
                <div>
                  <div style={styles.email}>📧 {item.email}</div>
                  <div style={styles.time}>
                    🕒 {item.loginTime?.toDate?.()?.toLocaleString?.() || "N/A"}
                  </div>
                </div>
              </div>
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
    fontFamily: "'Inter','Segoe UI',sans-serif", position: "relative",
  },
  glow: {
    position: "fixed", top: -100, right: "15%", width: 300, height: 300,
    background: "radial-gradient(circle,rgba(239,68,68,0.12),transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  container: { maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  totalBadge: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
    color: "#f87171", padding: "8px 16px", borderRadius: 12,
    fontSize: 13, fontWeight: 600, marginBottom: 16, display: "inline-block",
  },
  card: {
    background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "14px 18px", marginBottom: 10,
    backdropFilter: "blur(8px)", transition: "all 0.2s",
  },
  cardRow: { display: "flex", alignItems: "center", gap: 14 },
  indexBadge: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
    color: "#f87171", padding: "4px 10px", borderRadius: 8,
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  email: { color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 3 },
  time: { color: "#64748b", fontSize: 12 },
  center: { textAlign: "center", padding: 60 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .backBtn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8; padding: 9px 16px; border-radius: 10px;
    cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;
  }
  .backBtn:hover { background: rgba(255,255,255,0.1); color: white; }
  .hCard:hover { border-color: rgba(239,68,68,0.2); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 30px; height: 30px; margin: 0 auto; border: 3px solid rgba(139,92,246,0.2); border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.8s linear infinite; }
`;

export default LoginHistory;