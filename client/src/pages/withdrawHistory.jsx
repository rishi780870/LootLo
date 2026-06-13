import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function WithdrawHistory() {
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const q = query(collection(db, "withdrawRequests"), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setWithdraws(data);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const statusInfo = (status) => {
    if (status === "approved") return { label: "✅ Approved", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" };
    if (status === "rejected") return { label: "❌ Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" };
    return { label: "⏳ Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" };
  };

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow}></div>
      <div style={styles.container}>

        <div style={styles.header}>
          <button onClick={() => navigate("/history")} className="backBtn">← Back</button>
          <h1 style={styles.title}>💸 Withdraw History</h1>
          <span></span>
        </div>

        {loading ? (
          <div style={styles.center}>
            <div className="spinner"></div>
            <p style={{ marginTop: 14, color: "#64748b" }}>Loading...</p>
          </div>
        ) : withdraws.length === 0 ? (
          <div style={styles.center}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p style={{ color: "#64748b", marginTop: 12 }}>No withdraw history found</p>
          </div>
        ) : (
          withdraws.map((item) => {
            const s = statusInfo(item.status);
            return (
              <div key={item.id} style={styles.card} className="hCard">
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.amount}>₹{item.amount?.toLocaleString()}</div>
                    <div style={styles.date}>
                      📅 {item.createdAt?.toDate?.()?.toLocaleString?.() || "N/A"}
                    </div>
                  </div>
                  <div style={{
                    ...styles.badge,
                    background: s.bg, color: s.color,
                    border: `1px solid ${s.border}`,
                  }}>
                    {s.label}
                  </div>
                </div>
                <div style={styles.upi}>🏦 UPI: <span style={{ color: "#94a3b8" }}>{item.upiId}</span></div>
              </div>
            );
          })
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
    position: "fixed", top: -100, left: "15%", width: 300, height: 300,
    background: "radial-gradient(circle,rgba(245,158,11,0.12),transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  container: { maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  card: {
    background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "18px 20px", marginBottom: 12,
    backdropFilter: "blur(8px)", transition: "all 0.2s",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  amount: { fontSize: 22, fontWeight: 800, color: "#f59e0b", marginBottom: 4 },
  date: { color: "#64748b", fontSize: 12 },
  badge: { padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 },
  upi: { color: "#475569", fontSize: 13, fontWeight: 500 },
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
  .hCard:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 30px; height: 30px; margin: 0 auto; border: 3px solid rgba(139,92,246,0.2); border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.8s linear infinite; }
`;

export default WithdrawHistory;