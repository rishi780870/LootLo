import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function DepositHistory() {
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
      const q = query(collection(db, "depositRequests"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setHistory(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = (status) => {
    if (status === "approved") return { label: "✅ Approved", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" };
    if (status === "rejected") return { label: "❌ Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" };
    return { label: "⏳ Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" };
  };

  return (
    <div style={pageStyle}>
      <style>{commonCSS}</style>
      <div style={glowStyle("#10b981")}></div>
      <div style={container}>
        <div style={headerRow}>
          <button onClick={() => navigate("/history")} className="backBtn">← Back</button>
          <h1 style={titleStyle}>💳 Deposit History</h1>
          <span></span>
        </div>
        {loading ? <Loader /> : history.length === 0 ? <Empty msg="No deposit history found" /> : (
          history.map((item) => {
            const s = statusInfo(item.status);
            return (
              <div key={item.id} style={card} className="hCard">
                <div style={cardTop}>
                  <div>
                    <div style={amountStyle("#10b981")}>₹{item.amount?.toLocaleString()}</div>
                    <div style={dateStyle}>📅 {item.createdAt?.toDate?.()?.toLocaleString?.() || "N/A"}</div>
                  </div>
                  <div style={{ ...statusBadge, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</div>
                </div>
                <div style={utrStyle}>🧾 UTR: <span style={{ color: "#94a3b8" }}>{item.utr}</span></div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DepositHistory;

// ─────────────────────────────────────────────
// Shared helpers (used inline in this file only)
// ─────────────────────────────────────────────

const pageStyle = {
  minHeight: "100vh", background: "#020617", color: "white",
  fontFamily: "'Inter', 'Segoe UI', sans-serif", position: "relative",
};

const glowStyle = (color) => ({
  position: "fixed", top: -100, right: "15%", width: 300, height: 300,
  background: `radial-gradient(circle, ${color}20, transparent 70%)`,
  borderRadius: "50%", pointerEvents: "none",
});

const container = { maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 };

const headerRow = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 };

const titleStyle = { margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" };

const card = {
  background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16, padding: "18px 20px", marginBottom: 12, backdropFilter: "blur(8px)",
  transition: "all 0.2s",
};

const cardTop = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 };

const amountStyle = (color) => ({ fontSize: 22, fontWeight: 800, color, marginBottom: 4 });

const dateStyle = { color: "#64748b", fontSize: 12 };

const statusBadge = { padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 };

const utrStyle = { color: "#475569", fontSize: 13, fontWeight: 500 };

function Loader() {
  return (
    <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
      <div className="spinner"></div>
      <p style={{ marginTop: 14 }}>Loading...</p>
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 48 }}>📭</div>
      <p style={{ color: "#64748b", marginTop: 12 }}>{msg}</p>
    </div>
  );
}

const commonCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .backBtn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8; padding: 9px 16px; border-radius: 10px;
    cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;
  }
  .backBtn:hover { background: rgba(255,255,255,0.1); color: white; }
  .hCard:hover {
    border-color: rgba(255,255,255,0.15); transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 30px; height: 30px; margin: 0 auto;
    border: 3px solid rgba(139,92,246,0.2); border-top-color: #8b5cf6;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
`;