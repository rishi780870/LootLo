import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [animatedCoins, setAnimatedCoins] = useState(0);
  const [animatedBalance, setAnimatedBalance] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) { navigate("/"); return; }
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setUserData(docSnap.data());
      } catch (error) { console.log(error); }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userData) return;
    const targetCoins = userData.points || 0;
    const targetBal = userData.balance || 0;
    let startCoins = 0, startBal = 0;
    const duration = 1200, steps = 60;
    const intervalTime = duration / steps;
    const coinStep = targetCoins / steps;
    const balStep = targetBal / steps;
    const timer = setInterval(() => {
      startCoins = Math.min(startCoins + coinStep, targetCoins);
      startBal = Math.min(startBal + balStep, targetBal);
      setAnimatedCoins(Math.floor(startCoins));
      setAnimatedBalance(Math.floor(startBal));
      if (startCoins >= targetCoins && startBal >= targetBal) clearInterval(timer);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [userData]);

  const logout = async () => { await signOut(auth); navigate("/"); };

  if (!userData) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <p style={{ color: "#94a3b8", marginTop: 16, fontSize: 16 }}>Loading your dashboard...</p>
        <style>{spinnerCSS}</style>
      </div>
    );
  }

  const menuItems = [
    { icon: "🎡", label: "Spin Wheel", path: "/spinwheel", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
    { icon: "👥", label: "Refer & Earn", path: "/refer", gradient: "linear-gradient(135deg,#8b5cf6,#06b6d4)" },
    { icon: "💳", label: "Deposit", path: "/deposit", gradient: "linear-gradient(135deg,#10b981,#3b82f6)" },
    { icon: "💸", label: "Withdraw", path: "/withdraw", gradient: "linear-gradient(135deg,#f97316,#8b5cf6)" },
  ];

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glowTop}></div>
      <div style={styles.glowBottom}></div>

      <div style={styles.container}>

        {/* Header */}
        <header style={styles.header}>
          <div>
            <div style={styles.logoRow}>
              <span style={styles.logoText}>LootLo</span>
              <span style={styles.logoRocket}>🚀</span>
            </div>
            <p style={styles.logoSub}>Premium Rewards Platform</p>
          </div>
          <button onClick={logout} className="logoutBtn">
            <span>⎋</span> Logout
          </button>
        </header>

        {/* User Profile Card */}
        <div className="glassCard" style={styles.profileCard}>
          <div style={styles.profileLeft}>
            <div style={styles.avatarWrapper}>
              <img
                src={userData.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="user"
                style={styles.avatar}
              />
              <div style={styles.onlineDot}></div>
            </div>
            <div>
              <h2 style={styles.userName}>{userData.name}</h2>
              <p style={styles.userEmail}>{userData.email}</p>
              <span style={styles.roleBadge}>{userData.role || "user"}</span>
            </div>
          </div>
          <div style={styles.profileRight}>
            <div style={styles.statPill}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>Spins Left</span>
              <span style={{ color: "#f59e0b", fontSize: 22, fontWeight: 700 }}>{userData.spinsLeft || 0}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div className="glassCard statCard">
            <div style={styles.statIcon}>🪙</div>
            <p style={styles.statLabel}>Total Coins</p>
            <h1 style={{ ...styles.statValue, color: "#f59e0b" }}>{animatedCoins.toLocaleString()}</h1>
            <div style={{ ...styles.statBar, background: "linear-gradient(90deg,#f59e0b,#ef4444)" }}></div>
          </div>
          <div className="glassCard statCard">
            <div style={styles.statIcon}>💰</div>
            <p style={styles.statLabel}>Wallet Balance</p>
            <h1 style={{ ...styles.statValue, color: "#10b981" }}>₹{animatedBalance.toLocaleString()}</h1>
            <div style={{ ...styles.statBar, background: "linear-gradient(90deg,#10b981,#3b82f6)" }}></div>
          </div>
        </div>

        {/* ── WinGo Featured Banner ── */}
        <div
          className="wingoBanner"
          onClick={() => navigate("/wingo")}
        >
          <div style={styles.wingoLeft}>
            <div style={styles.wingoBadge}>🔥 LIVE</div>
            <h2 style={styles.wingoTitle}>WinGo</h2>
            <p style={styles.wingoSub}>Predict · Win · Repeat — Every 30 seconds</p>
            <div style={styles.wingoStats}>
              <span style={styles.wingoStat}>🎯 Up to 9x Return</span>
              <span style={styles.wingoStat}>⚡ Instant Result</span>
            </div>
          </div>
          <div style={styles.wingoRight}>
            <div style={styles.wingoCircle}>
              <span style={{ fontSize: 42 }}>🎰</span>
            </div>
            <span style={styles.wingoArrow}>→</span>
          </div>
        </div>

        {/* Menu Grid */}
        <div style={styles.menuGrid}>
          {menuItems.map((item) => (
            <div
              key={item.path}
              className="menuCard"
              onClick={() => navigate(item.path)}
              style={{ "--card-gradient": item.gradient }}
            >
              <div className="menuIcon" style={{ background: item.gradient }}>{item.icon}</div>
              <p className="menuLabel">{item.label}</p>
              <span className="menuArrow">→</span>
            </div>
          ))}
        </div>

        {/* History Banner */}
        <div className="glassCard historyCard" onClick={() => navigate("/history")}>
          <div style={styles.historyLeft}>
            <span style={{ fontSize: 32 }}>📜</span>
            <div>
              <h3 style={styles.historyTitle}>History Center</h3>
              <p style={styles.historySub}>Withdraw · Deposit · Spin · Referral · Login</p>
            </div>
          </div>
          <span style={styles.historyArrow}>→</span>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#020617", color: "white",
    position: "relative", overflowX: "hidden",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  glowTop: {
    position: "fixed", top: -200, left: "20%",
    width: 500, height: 500,
    background: "radial-gradient(circle,rgba(139,92,246,0.15),transparent 70%)",
    borderRadius: "50%", pointerEvents: "none", zIndex: 0,
  },
  glowBottom: {
    position: "fixed", bottom: -200, right: "10%",
    width: 400, height: 400,
    background: "radial-gradient(circle,rgba(245,158,11,0.12),transparent 70%)",
    borderRadius: "50%", pointerEvents: "none", zIndex: 0,
  },
  container: {
    maxWidth: 700, margin: "0 auto",
    padding: "30px 20px 50px", position: "relative", zIndex: 1,
  },
  loadingScreen: {
    minHeight: "100vh", background: "#020617",
    display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center",
  },
  spinner: { width: 44, height: 44 },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 30,
  },
  logoRow: { display: "flex", alignItems: "center", gap: 8 },
  logoText: {
    fontSize: 38, fontWeight: 800, letterSpacing: -1,
    background: "linear-gradient(135deg,#f59e0b,#ef4444,#8b5cf6)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  logoRocket: { fontSize: 30 },
  logoSub: { color: "#475569", fontSize: 13, marginTop: 2, letterSpacing: 1 },
  profileCard: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 16, marginBottom: 20, padding: "20px 24px",
  },
  profileLeft: { display: "flex", alignItems: "center", gap: 16 },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 72, height: 72, borderRadius: "50%",
    border: "3px solid #8b5cf6", objectFit: "cover",
  },
  onlineDot: {
    position: "absolute", bottom: 4, right: 4,
    width: 12, height: 12, borderRadius: "50%",
    background: "#10b981", border: "2px solid #0f172a",
  },
  userName: { margin: 0, fontSize: 20, fontWeight: 700, color: "#f1f5f9" },
  userEmail: { margin: "3px 0 8px", color: "#64748b", fontSize: 13 },
  roleBadge: {
    background: "rgba(139,92,246,0.2)", color: "#a78bfa",
    padding: "3px 10px", borderRadius: 20, fontSize: 12,
    border: "1px solid rgba(139,92,246,0.3)", textTransform: "capitalize",
  },
  profileRight: {},
  statPill: {
    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: 16, padding: "10px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  },
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statLabel: { color: "#64748b", fontSize: 13, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 },
  statValue: { fontSize: 40, fontWeight: 800, margin: "0 0 16px", letterSpacing: -1 },
  statBar: { height: 3, borderRadius: 2, width: "100%", opacity: 0.7 },
  // WinGo Banner
  wingoLeft: { flex: 1 },
  wingoBadge: {
    display: "inline-block",
    background: "rgba(239,68,68,0.2)", color: "#f87171",
    border: "1px solid rgba(239,68,68,0.35)",
    padding: "3px 10px", borderRadius: 20, fontSize: 11,
    fontWeight: 700, marginBottom: 8, letterSpacing: 1,
  },
  wingoTitle: {
    margin: "0 0 4px", fontSize: 28, fontWeight: 800,
    background: "linear-gradient(135deg, #f59e0b, #ef4444)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  wingoSub: { margin: "0 0 12px", color: "#94a3b8", fontSize: 13 },
  wingoStats: { display: "flex", gap: 12, flexWrap: "wrap" },
  wingoStat: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    padding: "4px 10px", borderRadius: 20, fontSize: 12, color: "#cbd5e1",
  },
  wingoRight: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 8,
  },
  wingoCircle: {
    width: 80, height: 80, borderRadius: "50%",
    background: "rgba(245,158,11,0.1)", border: "2px solid rgba(245,158,11,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  wingoArrow: { fontSize: 22, color: "#f59e0b" },
  menuGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  historyLeft: { display: "flex", alignItems: "center", gap: 16 },
  historyTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
  historySub: { margin: "4px 0 0", color: "#64748b", fontSize: 13 },
  historyArrow: { fontSize: 22, color: "#475569" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .glassCard {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    backdrop-filter: blur(12px);
    transition: border-color 0.2s;
  }
  .glassCard:hover { border-color: rgba(255,255,255,0.13); }
  .statCard { padding: 24px; text-align: center; }

  .wingoBanner {
    background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08));
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 20px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }
  .wingoBanner::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, rgba(245,158,11,0.05), rgba(239,68,68,0.05));
    opacity: 0;
    transition: opacity 0.2s;
  }
  .wingoBanner:hover {
    transform: translateY(-3px);
    border-color: rgba(245,158,11,0.45);
    box-shadow: 0 12px 40px rgba(245,158,11,0.15);
  }
  .wingoBanner:hover::before { opacity: 1; }

  .menuCard {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 24px 20px;
    cursor: pointer;
    display: flex; flex-direction: column;
    align-items: flex-start; gap: 8px;
    transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
    position: relative; overflow: hidden;
  }
  .menuCard::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: var(--card-gradient); opacity: 0; transition: opacity 0.2s;
  }
  .menuCard:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,0.15);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }
  .menuCard:hover::before { opacity: 1; }
  .menuIcon {
    width: 48px; height: 48px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 4px;
  }
  .menuLabel { margin: 0; font-size: 15px; font-weight: 700; color: #e2e8f0; }
  .menuArrow { color: #475569; font-size: 18px; margin-top: auto; transition: color 0.2s, transform 0.2s; }
  .menuCard:hover .menuArrow { color: #94a3b8; transform: translateX(4px); }

  .historyCard {
    padding: 22px 26px; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .historyCard:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }

  .logoutBtn {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
    color: #f87171; padding: 10px 20px; border-radius: 12px;
    cursor: pointer; font-size: 14px; font-weight: 600;
    display: flex; align-items: center; gap: 6px;
    transition: background 0.2s, border-color 0.2s;
  }
  .logoutBtn:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.4); }
`;

const spinnerCSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  div[style*="width: 44px"] {
    border: 3px solid rgba(139,92,246,0.2);
    border-top-color: #8b5cf6;
    animation: spin 0.8s linear infinite;
    border-radius: 50%;
  }
`;

export default Dashboard;