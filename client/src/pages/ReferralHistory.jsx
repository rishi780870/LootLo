import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ReferralHistory() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((item) => item.referredBy === user.uid);
      setReferrals(data);
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
          <h1 style={styles.title}>👥 Referral History</h1>
          <span></span>
        </div>

        {/* Summary */}
        {!loading && (
          <div style={styles.summaryCard}>
            <div style={styles.summaryRow}>
              <div style={styles.summaryItem}>
                <div style={styles.summaryVal}>{referrals.length}</div>
                <div style={styles.summaryLabel}>Total Referrals</div>
              </div>
              <div style={styles.summaryDivider}></div>
              <div style={styles.summaryItem}>
                <div style={{ ...styles.summaryVal, color: "#f59e0b" }}>+{referrals.length} 🎡</div>
                <div style={styles.summaryLabel}>Spins Earned</div>
              </div>
            </div>
            <p style={styles.summaryNote}>Each referral = +1 Spin bonus for you</p>
          </div>
        )}

        {loading ? (
          <div style={styles.center}>
            <div className="spinner"></div>
            <p style={{ marginTop: 14, color: "#64748b" }}>Loading...</p>
          </div>
        ) : referrals.length === 0 ? (
          <div style={styles.center}>
            <div style={{ fontSize: 48 }}>👥</div>
            <p style={{ color: "#64748b", marginTop: 12 }}>No referrals yet</p>
            <p style={{ color: "#475569", fontSize: 13 }}>Share your code to earn spins!</p>
            <button onClick={() => navigate("/refer")} className="referBtn">Share Code →</button>
          </div>
        ) : (
          referrals.map((item, idx) => (
            <div key={item.id} style={styles.card} className="hCard">
              <div style={styles.cardRow}>
                <div style={styles.avatar}>{item.name?.[0]?.toUpperCase() || "?"}</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.name}>👤 {item.name}</div>
                  <div style={styles.email}>📧 {item.email}</div>
                </div>
                <div style={styles.spinBadge}>+1 🎡</div>
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
    background: "radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  container: { maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  summaryCard: {
    background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)",
    borderRadius: 16, padding: "20px", marginBottom: 20,
  },
  summaryRow: { display: "flex", alignItems: "center", justifyContent: "space-around", marginBottom: 8 },
  summaryItem: { textAlign: "center" },
  summaryVal: { fontSize: 28, fontWeight: 800, color: "#06b6d4" },
  summaryLabel: { color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
  summaryDivider: { width: 1, height: 40, background: "rgba(255,255,255,0.08)" },
  summaryNote: { color: "#475569", fontSize: 12, textAlign: "center", margin: 0 },
  card: {
    background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "14px 18px", marginBottom: 10,
    backdropFilter: "blur(8px)", transition: "all 0.2s",
  },
  cardRow: { display: "flex", alignItems: "center", gap: 14 },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "linear-gradient(135deg,#06b6d4,#8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, fontWeight: 800, flexShrink: 0,
  },
  name: { color: "#e2e8f0", fontSize: 15, fontWeight: 700, marginBottom: 3 },
  email: { color: "#64748b", fontSize: 12 },
  spinBadge: {
    background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
    color: "#f59e0b", padding: "5px 12px", borderRadius: 20,
    fontWeight: 700, fontSize: 13, flexShrink: 0,
  },
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
  .hCard:hover { border-color: rgba(6,182,212,0.2); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
  .referBtn {
    margin-top: 16px; padding: 10px 24px;
    background: linear-gradient(135deg,#06b6d4,#8b5cf6);
    border: none; border-radius: 10px; color: white;
    font-size: 14px; font-weight: 700; cursor: pointer;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 30px; height: 30px; margin: 0 auto; border: 3px solid rgba(6,182,212,0.2); border-top-color: #06b6d4; border-radius: 50%; animation: spin 0.8s linear infinite; }
`;

export default ReferralHistory;