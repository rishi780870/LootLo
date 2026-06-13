import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_PASSWORD = "Admin@123";

function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    if (!password) { setError("Enter password"); return; }
    setLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem("adminAuth", "true");
        navigate("/admin-dashboard");
      } else {
        setError("Wrong password! Access denied.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      <div style={styles.card}>
        <div style={styles.shieldWrap}>
          <span style={{ fontSize: 48 }}>🛡️</span>
        </div>
        <h1 style={styles.title}>Admin Portal</h1>
        <p style={styles.subtitle}>Restricted access — LootLo Staff only</p>

        <div style={styles.inputGroup}>
          <span style={styles.inputIcon}>🔑</span>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Admin Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={styles.input}
            className="adminInput"
          />
          <span style={styles.eyeIcon} onClick={() => setShowPass(!showPass)}>
            {showPass ? "🙈" : "👁️"}
          </span>
        </div>

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={styles.btn}
          className="adminBtn"
        >
          {loading ? <span className="btnSpinner"></span> : "🔓 Enter Admin Panel"}
        </button>

        <button
          onClick={() => navigate("/")}
          style={styles.backBtn}
          className="backBtn"
        >
          ← Back to App
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#020617",
    display: "flex", justifyContent: "center", alignItems: "center",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    position: "relative", overflow: "hidden", padding: 20,
  },
  glow1: {
    position: "fixed", top: -100, left: "20%", width: 400, height: 400,
    background: "radial-gradient(circle, rgba(239,68,68,0.15), transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  glow2: {
    position: "fixed", bottom: -100, right: "20%", width: 300, height: 300,
    background: "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  card: {
    width: "100%", maxWidth: 400, padding: "44px 36px",
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 24, backdropFilter: "blur(20px)",
    position: "relative", zIndex: 1,
    textAlign: "center",
  },
  shieldWrap: { marginBottom: 16 },
  title: {
    margin: "0 0 6px", fontSize: 28, fontWeight: 800,
    background: "linear-gradient(135deg, #ef4444, #f97316)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  subtitle: { color: "#64748b", fontSize: 13, margin: "0 0 28px" },
  inputGroup: {
    position: "relative", marginBottom: 16,
    display: "flex", alignItems: "center",
  },
  inputIcon: { position: "absolute", left: 14, fontSize: 16, zIndex: 1 },
  input: {
    width: "100%", padding: "14px 44px 14px 44px",
    background: "rgba(239,68,68,0.05)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 12, color: "white", fontSize: 15,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
    textAlign: "left",
  },
  eyeIcon: { position: "absolute", right: 14, cursor: "pointer", fontSize: 16 },
  errorBox: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10, padding: "10px 14px", color: "#f87171",
    fontSize: 13, marginBottom: 16, textAlign: "left",
  },
  btn: {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    border: "none", borderRadius: 12,
    color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
    marginBottom: 12, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 8, transition: "all 0.2s",
  },
  backBtn: {
    width: "100%", padding: "12px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, color: "#64748b",
    fontSize: 14, cursor: "pointer", transition: "all 0.2s",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .adminInput:focus {
    border-color: rgba(239,68,68,0.5) !important;
    background: rgba(239,68,68,0.08) !important;
  }
  .adminInput::placeholder { color: #475569; }
  .adminBtn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(239,68,68,0.3);
  }
  .adminBtn:disabled { opacity: 0.6; cursor: not-allowed; }
  .backBtn:hover { color: #94a3b8 !important; border-color: rgba(255,255,255,0.2) !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .btnSpinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
`;

export default AdminLogin;