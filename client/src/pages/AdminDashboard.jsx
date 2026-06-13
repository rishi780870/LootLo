import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    pendingDeposits: 0,
    totalWithdraws: 0,
    pendingWithdraws: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (!auth) { navigate("/admin-login"); return; }
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const [usersSnap, depositSnap, withdrawSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "depositRequests")),
        getDocs(collection(db, "withdrawRequests")),
      ]);

      const users = usersSnap.docs.map((d) => d.data());
      const deposits = depositSnap.docs.map((d) => d.data());
      const withdraws = withdrawSnap.docs.map((d) => d.data());

      setStats({
        totalUsers: users.length,
        totalDeposits: deposits.filter((d) => d.status === "approved").reduce((s, d) => s + (d.amount || 0), 0),
        pendingDeposits: deposits.filter((d) => d.status === "pending").length,
        totalWithdraws: withdraws.filter((w) => w.status === "approved").reduce((s, w) => s + (w.amount || 0), 0),
        pendingWithdraws: withdraws.filter((w) => w.status === "pending").length,
        totalBalance: users.reduce((s, u) => s + (u.balance || 0), 0),
      });
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("adminAuth");
    navigate("/admin-login");
  };

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    { label: "Total Deposited", value: `₹${stats.totalDeposits.toLocaleString()}`, icon: "💳", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { label: "Pending Deposits", value: stats.pendingDeposits, icon: "⏳", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { label: "Total Withdrawn", value: `₹${stats.totalWithdraws.toLocaleString()}`, icon: "💸", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    { label: "Pending Withdraws", value: stats.pendingWithdraws, icon: "🔄", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
    { label: "Total User Balance", value: `₹${stats.totalBalance.toLocaleString()}`, icon: "💰", color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  ];

  const actions = [
    { label: "💳 Manage Deposits", desc: "Approve or reject deposit requests", path: "/admin-deposit", color: "#10b981", badge: stats.pendingDeposits },
    { label: "💸 Manage Withdrawals", desc: "Approve or reject withdraw requests", path: "/admin-withdraw", color: "#f59e0b", badge: stats.pendingWithdraws },
  ];

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow1}></div>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <div style={styles.logoRow}>
              <span style={styles.logo}>LootLo</span>
              <span style={{ fontSize: 22, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", padding: "2px 10px", borderRadius: 20, color: "#f87171", fontSize: 12, fontWeight: 700 }}>
                ADMIN
              </span>
            </div>
            <p style={styles.logoSub}>Admin Control Panel</p>
          </div>
          <button onClick={logout} className="logoutBtn">⎋ Logout</button>
        </header>

        <h2 style={styles.sectionTitle}>📊 Platform Overview</h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <div className="spinner"></div>
            <p style={{ marginTop: 16 }}>Loading stats...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={styles.statsGrid}>
              {statCards.map((card) => (
                <div key={card.label} style={{ ...styles.statCard, background: card.bg, borderColor: card.color + "33" }} className="statCard">
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                  <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
                  <div style={styles.statLabel}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Action Cards */}
            <h2 style={styles.sectionTitle}>⚙️ Quick Actions</h2>
            <div style={styles.actionsGrid}>
              {actions.map((action) => (
                <div
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="actionCard"
                  style={{ "--ac": action.color }}
                >
                  <div style={styles.actionTop}>
                    <h3 style={{ ...styles.actionLabel, color: action.color }}>{action.label}</h3>
                    {action.badge > 0 && (
                      <span style={{ ...styles.badge, background: action.color }}>
                        {action.badge} pending
                      </span>
                    )}
                  </div>
                  <p style={styles.actionDesc}>{action.desc}</p>
                  <span style={{ ...styles.actionArrow, color: action.color }}>→ Manage</span>
                </div>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={loadStats} className="refreshBtn">
              🔄 Refresh Stats
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#020617", color: "white",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    position: "relative", overflowX: "hidden",
  },
  glow1: {
    position: "fixed", top: -150, right: "10%", width: 400, height: 400,
    background: "radial-gradient(circle, rgba(239,68,68,0.12), transparent 70%)",
    borderRadius: "50%", pointerEvents: "none", zIndex: 0,
  },
  container: {
    maxWidth: 800, margin: "0 auto",
    padding: "30px 20px 60px", position: "relative", zIndex: 1,
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 32,
  },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  logo: {
    fontSize: 28, fontWeight: 800,
    background: "linear-gradient(135deg, #f59e0b, #ef4444)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  logoSub: { color: "#475569", fontSize: 13, margin: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: "0 0 16px" },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14, marginBottom: 32,
  },
  statCard: {
    padding: "20px", borderRadius: 16,
    border: "1px solid", textAlign: "center",
    transition: "transform 0.18s",
  },
  statValue: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  statLabel: { color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  actionsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16, marginBottom: 24,
  },
  actionTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  actionLabel: { margin: 0, fontSize: 16, fontWeight: 700 },
  badge: {
    color: "white", fontSize: 11, fontWeight: 700,
    padding: "3px 10px", borderRadius: 20,
  },
  actionDesc: { color: "#64748b", fontSize: 13, margin: "0 0 12px" },
  actionArrow: { fontSize: 13, fontWeight: 600 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .statCard:hover { transform: translateY(-2px); }
  .actionCard {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px; padding: 22px;
    cursor: pointer; transition: all 0.2s;
  }
  .actionCard:hover {
    border-color: var(--ac, #8b5cf6);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }
  .logoutBtn {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
    color: #f87171; padding: 10px 20px; border-radius: 12px;
    cursor: pointer; font-size: 14px; font-weight: 600;
    transition: all 0.2s;
  }
  .logoutBtn:hover { background: rgba(239,68,68,0.18); }
  .refreshBtn {
    display: block; margin: 0 auto;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8; padding: 12px 28px; border-radius: 12px;
    cursor: pointer; font-size: 14px; font-weight: 600;
    transition: all 0.2s;
  }
  .refreshBtn:hover { background: rgba(255,255,255,0.1); color: white; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 36px; height: 36px; margin: 0 auto;
    border: 3px solid rgba(139,92,246,0.2);
    border-top-color: #8b5cf6; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
`;