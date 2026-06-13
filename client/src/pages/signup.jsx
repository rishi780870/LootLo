import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc, setDoc, collection, query, where, getDocs, updateDoc,
} from "firebase/firestore";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [is18Plus, setIs18Plus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1); // 2-step form

  const nextStep = () => {
    if (!name) { alert("Enter your name"); return; }
    if (!email) { alert("Enter email"); return; }
    setStep(2);
  };

  const signup = async () => {
    if (password !== confirmPassword) { alert("Passwords do not match"); return; }
    if (!is18Plus) { alert("You must be 18+"); return; }
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        name,
        email,
        referredBy: "",
        points: 500,
        balance: 0,
        totalEarning: 0,
        totalWithdraw: 0,
        spinsLeft: 1,
        totalReferrals: 0,
        referralCode: myReferralCode,
        role: "user",
        is18Plus: true,
        createdAt: new Date(),
      });

      if (referralCode && referralCode.trim() !== "") {
        const q = query(
          collection(db, "users"),
          where("referralCode", "==", referralCode.trim().toUpperCase())
        );
        const referralSnapshot = await getDocs(q);
        if (!referralSnapshot.empty) {
          const refDoc = referralSnapshot.docs[0];
          const refData = refDoc.data();
          await updateDoc(doc(db, "users", refDoc.id), {
            spinsLeft: (refData.spinsLeft || 0) + 1,
            totalReferrals: (refData.totalReferrals || 0) + 1,
          });
          await updateDoc(doc(db, "users", result.user.uid), {
            referredBy: refDoc.id,
          });
        }
      }

      alert("Account Created Successfully ✅");
      navigate("/");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      <div style={styles.card} className="glassCard">
        <div style={styles.logoWrap}>
          <span style={styles.logo}>LootLo</span>
          <span style={{ fontSize: 32 }}>🚀</span>
        </div>
        <p style={styles.subtitle}>Create your account — it&apos;s free!</p>

        {/* Step Indicator */}
        <div style={styles.stepRow}>
          <div style={{ ...styles.stepDot, background: "#8b5cf6" }}>1</div>
          <div style={{ ...styles.stepLine, background: step === 2 ? "#8b5cf6" : "rgba(255,255,255,0.1)" }}></div>
          <div style={{ ...styles.stepDot, background: step === 2 ? "#8b5cf6" : "rgba(255,255,255,0.1)" }}>2</div>
        </div>

        {step === 1 && (
          <>
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>👤</span>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                className="glassInput"
              />
            </div>

            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>📧</span>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                className="glassInput"
              />
            </div>

            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>🎁</span>
              <input
                type="text"
                placeholder="Referral Code (Optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                style={styles.input}
                className="glassInput"
              />
            </div>

            <button onClick={nextStep} style={styles.primaryBtn} className="primaryBtn">
              Next →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingRight: 48 }}
                className="glassInput"
              />
              <span style={styles.eyeIcon} onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </span>
            </div>

            <div style={styles.inputGroup}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                className="glassInput"
              />
            </div>

            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={is18Plus}
                onChange={(e) => setIs18Plus(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#8b5cf6" }}
              />
              <span style={{ color: "#94a3b8", fontSize: 14 }}>
                I confirm that I am <strong style={{ color: "#f1f5f9" }}>18 years or older</strong>
              </span>
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{ ...styles.primaryBtn, background: "rgba(255,255,255,0.06)", flex: 0.4 }}
                className="backBtn"
              >
                ← Back
              </button>
              <button
                onClick={signup}
                disabled={loading}
                style={{ ...styles.primaryBtn, flex: 1 }}
                className="primaryBtn"
              >
                {loading ? <span className="btnSpinner"></span> : "Create Account ✅"}
              </button>
            </div>
          </>
        )}

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/" style={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex", justifyContent: "center", alignItems: "center",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    position: "relative", overflow: "hidden", padding: "20px",
  },
  glow1: {
    position: "fixed", top: -150, right: "10%",
    width: 500, height: 500,
    background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  glow2: {
    position: "fixed", bottom: -150, left: "10%",
    width: 400, height: 400,
    background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  card: {
    width: "100%", maxWidth: 420,
    padding: "40px 36px", borderRadius: 24,
    position: "relative", zIndex: 1,
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  logo: {
    fontSize: 36, fontWeight: 800, letterSpacing: -1,
    background: "linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  subtitle: { color: "#64748b", fontSize: 14, margin: "0 0 24px" },
  stepRow: {
    display: "flex", alignItems: "center", gap: 0, marginBottom: 28,
  },
  stepDot: {
    width: 30, height: 30, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
    transition: "background 0.3s",
  },
  stepLine: {
    flex: 1, height: 2, transition: "background 0.3s",
  },
  inputGroup: {
    position: "relative", marginBottom: 16,
    display: "flex", alignItems: "center",
  },
  inputIcon: { position: "absolute", left: 14, fontSize: 16, zIndex: 1 },
  input: {
    width: "100%", padding: "14px 14px 14px 44px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, color: "white", fontSize: 15,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  },
  eyeIcon: { position: "absolute", right: 14, cursor: "pointer", fontSize: 16 },
  checkLabel: {
    display: "flex", alignItems: "center", gap: 10,
    marginBottom: 20, cursor: "pointer",
  },
  primaryBtn: {
    width: "100%", padding: "15px",
    background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    border: "none", borderRadius: 12,
    color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
    marginBottom: 16, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 8, transition: "all 0.2s",
  },
  footerText: { color: "#64748b", fontSize: 14, textAlign: "center", margin: "8px 0 0" },
  link: { color: "#a78bfa", textDecoration: "none", fontWeight: 600 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .glassCard {
    background: rgba(15,23,42,0.85);
    border: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(20px);
  }
  .glassInput:focus {
    border-color: rgba(139,92,246,0.5) !important;
    background: rgba(139,92,246,0.06) !important;
  }
  .glassInput::placeholder { color: #475569; }
  .primaryBtn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(139,92,246,0.35);
  }
  .primaryBtn:disabled { opacity: 0.6; cursor: not-allowed; }
  .backBtn:hover { background: rgba(255,255,255,0.1) !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .btnSpinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
`;

export default Signup;