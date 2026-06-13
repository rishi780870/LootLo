import { useNavigate } from "react-router-dom";

function History() {
  const navigate = useNavigate();

  const cards = [
    { icon: "💸", label: "Withdraw History", path: "/withdraw-history", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
    { icon: "💳", label: "Deposit History", path: "/deposit-history", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
    { icon: "🎡", label: "Spin History", path: "/spin-history", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)" },
    { icon: "👥", label: "Referral History", path: "/referral-history", color: "#06b6d4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.25)" },
    { icon: "🔐", label: "Login History", path: "/login-history", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
    { icon: "🎯", label: "WinGo History", path: "/wingo-history", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)" },
  ];

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate("/dashboard")} className="backBtn">← Dashboard</button>
        </div>

        <div style={styles.titleWrap}>
          <span style={{ fontSize: 36 }}>📜</span>
          <div>
            <h1 style={styles.title}>History Center</h1>
            <p style={styles.subtitle}>All your activity in one place</p>
          </div>
        </div>

        <div style={styles.grid}>
          {cards.map((card) => (
            <div
              key={card.path}
              onClick={() => navigate(card.path)}
              className="histCard"
              style={{
                "--hc": card.color,
                "--hbg": card.bg,
                "--hborder": card.border,
              }}
            >
              <div className="histIcon" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                <span style={{ fontSize: 28 }}>{card.icon}</span>
              </div>
              <p className="histLabel">{card.label}</p>
              <span className="histArrow" style={{ color: card.color }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#020617", color: "white",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    position: "relative", overflow: "hidden",
  },
  glow1: {
    position: "fixed", top: -100, left: "20%", width: 400, height: 400,
    background: "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  glow2: {
    position: "fixed", bottom: -100, right: "20%", width: 300, height: 300,
    background: "radial-gradient(circle, rgba(245,158,11,0.10), transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  container: { maxWidth: 700, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 },
  header: { marginBottom: 24 },
  titleWrap: { display: "flex", alignItems: "center", gap: 16, marginBottom: 32 },
  title: { margin: 0, fontSize: 30, fontWeight: 800, color: "#f1f5f9" },
  subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: 14 },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14,
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
  .histCard {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px; padding: 24px 20px;
    cursor: pointer; display: flex; flex-direction: column;
    align-items: flex-start; gap: 12px;
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .histCard::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--hc); opacity: 0; transition: opacity 0.2s;
  }
  .histCard:hover {
    border-color: var(--hborder);
    background: var(--hbg);
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(0,0,0,0.35);
  }
  .histCard:hover::after { opacity: 1; }
  .histIcon {
    width: 56px; height: 56px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .histLabel {
    margin: 0; font-size: 15px; font-weight: 700; color: #e2e8f0;
  }
  .histArrow {
    font-size: 18px; margin-top: auto;
    transition: transform 0.2s;
  }
  .histCard:hover .histArrow { transform: translateX(4px); }
`;

export default History;