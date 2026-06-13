import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function SpinHistory() {
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
      // Fixed: proper where query instead of client-side filter
      const q = query(collection(db, "spinHistory"), where("uid", "==", user.uid));
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

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow}></div>
      <div style={styles.container}>

        <div style={styles.header}>
          <button onClick={() => navigate("/history")} className="backBtn">← Back</button>
          <h1 style={styles.title}>🎡 Spin History</h1>
          <span></span>
        </div>

        {/* Summary */}
        {!loading && history.length > 0 && (
          <div style={styles.summaryRow}>
            <div style={styles.summaryCard}>
              <div style={{ fontSize: 20 }}>🎰</div>
              <div style={styles.summaryVal}>{history.length}</div>
              <div style={styles.summaryLabel}>Total Spins</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={{ fontSize: 20 }}>🪙</div>
              <div style={{ ...styles.summaryVal, color: "#f59e0b" }}>
                {history.reduce((s, i) => s + (i.rewardCoins || 0), 0).toLocaleString()}
              </div>
              <div style={styles.summaryLabel}>Total Coins</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={{ fontSize: 20 }}>🏆</div>
              <div style={{ ...styles.summaryVal, color: "#10b981" }}>
                {history.filter((i) => i.reward !== "Better Luck").length}
              </div>
              <div style={styles.summaryLabel}>Wins</div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={styles.center}>
            <div className="spinner"></div>
            <p style={{ marginTop: 14, color: "#64748b" }}>Loading...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={styles.center}>
            <div style={{ fontSize: 48 }}>🎡</div>
            <p style={{ color: "#64748b", marginTop: 12 }}>No spin history yet. Go spin!</p>
            <button onClick={() => navigate("/spinwheel")} className="spinNowBtn">Spin Now →</button>
          </div>
        ) : (
          history.map((item) => {
            const isWin = item.reward !== "Better Luck";
            return (
              <div key={item.id} style={styles.card} className="hCard">
                <div style={styles.cardTop}>
                  <div style={styles.rewardWrap}>
                    <span style={{ fontSize: 24 }}>{isWin ? "🎁" : "😢"}</span>
                    <div>
                      <div style={{ ...styles.rewardText, color: isWin ? "#f59e0b" : "#64748b" }}>
                        {item.reward}
                      </div>
                      <div style={styles.date}>
                        📅 {item.createdAt?.toDate?.()?.toLocaleString?.() || "N/A"}
                      </div>
                    </div>
                  </div>
                  {isWin && item.rewardCoins > 0 && (
                    <div style={styles.coinsBadge}>+{item.rewardCoins} 🪙</div>
                  )}
                </div>
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
    position: "fixed", top: -100, right: "15%", width: 300, height: 300,
    background: "radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  container: { maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  summaryRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 },
  summaryCard: {
    background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "16px 12px", textAlign: "center",
  },
  summaryVal: { fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "4px 0" },
  summaryLabel: { color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  card: {
    background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "16px 20px", marginBottom: 10,
    backdropFilter: "blur(8px)", transition: "all 0.2s",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  rewardWrap: { display: "flex", alignItems: "center", gap: 12 },
  rewardText: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  date: { color: "#64748b", fontSize: 12 },
  coinsBadge: {
    background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
    color: "#f59e0b", padding: "5px 12px", borderRadius: 20,
    fontWeight: 700, fontSize: 14,
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
  .hCard:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
  .spinNowBtn {
    margin-top: 16px; padding: 10px 24px;
    background: linear-gradient(135deg,#8b5cf6,#6d28d9);
    border: none; border-radius: 10px; color: white;
    font-size: 14px; font-weight: 700; cursor: pointer;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 30px; height: 30px; margin: 0 auto; border: 3px solid rgba(139,92,246,0.2); border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.8s linear infinite; }
`;

export default SpinHistory;