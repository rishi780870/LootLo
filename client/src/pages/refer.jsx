import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Refer() {
  const [userData, setUserData] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserData(snap.data());
    });
    return () => unsubscribe();
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(userData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/signup?ref=${userData.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!userData) {
    return (
      <div style={styles.loading}>
        <style>{css}</style>
        <div className="spinner"></div>
      </div>
    );
  }

  const steps = [
    { icon: "📋", text: "Copy your referral code below" },
    { icon: "📤", text: "Share it with your friends" },
    { icon: "✅", text: "Friend signs up using your code" },
    { icon: "🎡", text: "You both get +1 Spin bonus!" },
  ];

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate("/dashboard")} className="backBtn">← Back</button>
          <h1 style={styles.title}>👥 Refer & Earn</h1>
          <span></span>
        </div>

        {/* Hero Banner */}
        <div style={styles.heroBanner}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🎁</div>
          <h2 style={styles.heroTitle}>Invite Friends, Earn Spins!</h2>
          <p style={styles.heroSub}>For every friend who joins using your code, you get a free spin on the wheel.</p>
        </div>

        {/* Code Card */}
        <div style={styles.codeCard}>
          <p style={styles.codeLabel}>Your Referral Code</p>
          <div style={styles.codeBox}>
            <span style={styles.codeText}>{userData.referralCode}</span>
          </div>
          <div style={styles.btnRow}>
            <button onClick={copyCode} className="copyCodeBtn">
              {copied ? "✅ Copied!" : "📋 Copy Code"}
            </button>
            <button onClick={copyLink} className="copyLinkBtn">
              🔗 Copy Link
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={{ fontSize: 24 }}>👥</div>
            <div style={styles.statVal}>{userData.totalReferrals || 0}</div>
            <div style={styles.statLabel}>Total Referrals</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: 24 }}>🎡</div>
            <div style={{ ...styles.statVal, color: "#f59e0b" }}>{userData.spinsLeft || 0}</div>
            <div style={styles.statLabel}>Spins Left</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: 24 }}>🏆</div>
            <div style={{ ...styles.statVal, color: "#10b981" }}>{userData.totalReferrals || 0}</div>
            <div style={styles.statLabel}>Bonus Spins Earned</div>
          </div>
        </div>

        {/* How it works */}
        <div style={styles.howCard}>
          <h3 style={styles.howTitle}>How it works</h3>
          {steps.map((s, i) => (
            <div key={i} style={styles.stepRow}>
              <div style={styles.stepIcon}>{s.icon}</div>
              <p style={styles.stepText}>{s.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/referral-history")}
          className="historyBtn"
        >
          📜 View Referral History →
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#020617", color: "white",
    fontFamily: "'Inter','Segoe UI',sans-serif", position: "relative",
  },
  loading: {
    minHeight: "100vh", background: "#020617",
    display: "flex", justifyContent: "center", alignItems: "center",
  },
  glow1: {
    position: "fixed", top: -100, left: "10%", width: 350, height: 350,
    background: "radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  glow2: {
    position: "fixed", bottom: -100, right: "10%", width: 300, height: 300,
    background: "radial-gradient(circle,rgba(6,182,212,0.10),transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  container: { maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  heroBanner: {
    background: "linear-gradient(135deg,rgba(139,92,246,0.12),rgba(6,182,212,0.08))",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: 18, padding: "28px", textAlign: "center", marginBottom: 16,
  },
  heroTitle: { margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  heroSub: { color: "#64748b", fontSize: 14, margin: 0, lineHeight: 1.6 },
  codeCard: {
    background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18, padding: "24px", backdropFilter: "blur(10px)", marginBottom: 16, textAlign: "center",
  },
  codeLabel: { color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px" },
  codeBox: {
    background: "rgba(139,92,246,0.1)", border: "2px dashed rgba(139,92,246,0.35)",
    borderRadius: 12, padding: "16px", marginBottom: 16,
  },
  codeText: {
    fontSize: 32, fontWeight: 800, letterSpacing: 6,
    background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  btnRow: { display: "flex", gap: 10 },
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 },
  statCard: {
    background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "16px 12px", textAlign: "center",
  },
  statVal: { fontSize: 24, fontWeight: 800, color: "#8b5cf6", margin: "6px 0 4px" },
  statLabel: { color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  howCard: {
    background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "20px", marginBottom: 16,
  },
  howTitle: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" },
  stepRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, flexShrink: 0,
  },
  stepText: { color: "#94a3b8", fontSize: 14, margin: 0 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .backBtn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8; padding: 9px 16px; border-radius: 10px;
    cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;
  }
  .backBtn:hover { background: rgba(255,255,255,0.1); color: white; }
  .copyCodeBtn {
    flex: 1; padding: 12px;
    background: linear-gradient(135deg,#8b5cf6,#6d28d9);
    border: none; border-radius: 10px; color: white;
    font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .copyCodeBtn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139,92,246,0.3); }
  .copyLinkBtn {
    flex: 1; padding: 12px;
    background: rgba(6,182,212,0.12); border: 1px solid rgba(6,182,212,0.3);
    border-radius: 10px; color: #06b6d4;
    font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .copyLinkBtn:hover { background: rgba(6,182,212,0.2); }
  .historyBtn {
    display: block; width: 100%; padding: 13px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; color: #94a3b8;
    font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    text-align: center;
  }
  .historyBtn:hover { background: rgba(255,255,255,0.09); color: white; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 30px; height: 30px; border: 3px solid rgba(139,92,246,0.2); border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.8s linear infinite; }
`;

export default Refer;