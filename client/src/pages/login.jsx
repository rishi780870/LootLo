// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { auth, db } from "../firebase";
// import {
//   GoogleAuthProvider,
//   signInWithPopup,
//   signInWithEmailAndPassword,
// } from "firebase/auth";
// import { addDoc, collection } from "firebase/firestore";

// function Login() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showPass, setShowPass] = useState(false);

//   const saveLoginHistory = async (user) => {
//     try {
//       await addDoc(collection(db, "loginHistory"), {
//         uid: user.uid,
//         email: user.email,
//         loginTime: new Date(),
//       });
//     } catch (e) {
//       console.log(e);
//     }
//   };

//   const login = async () => {
//     if (!email || !password) { alert("Enter Email and Password"); return; }
//     setLoading(true);
//     try {
//       const result = await signInWithEmailAndPassword(auth, email, password);
//       await saveLoginHistory(result.user);
//       navigate("/dashboard");
//     } catch (error) {
//       alert(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const googleLogin = async () => {
//     setLoading(true);
//     try {
//       const provider = new GoogleAuthProvider();
//       const result = await signInWithPopup(auth, provider);
//       await saveLoginHistory(result.user);
//       navigate("/dashboard");
//     } catch (error) {
//       alert(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.page}>
//       <style>{css}</style>

//       <div style={styles.glow1}></div>
//       <div style={styles.glow2}></div>

//       <div style={styles.card} className="glassCard">
//         {/* Logo */}
//         <div style={styles.logoWrap}>
//           <span style={styles.logo}>LootLo</span>
//           <span style={{ fontSize: 32 }}>🚀</span>
//         </div>
//         <p style={styles.subtitle}>Welcome back! Sign in to continue</p>

//         {/* Email */}
//         <div style={styles.inputGroup}>
//           <span style={styles.inputIcon}>📧</span>
//           <input
//             type="email"
//             placeholder="Email address"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             style={styles.input}
//             className="glassInput"
//           />
//         </div>

//         {/* Password */}
//         <div style={styles.inputGroup}>
//           <span style={styles.inputIcon}>🔒</span>
//           <input
//             type={showPass ? "text" : "password"}
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && login()}
//             style={{ ...styles.input, paddingRight: 48 }}
//             className="glassInput"
//           />
//           <span
//             style={styles.eyeIcon}
//             onClick={() => setShowPass(!showPass)}
//           >
//             {showPass ? "🙈" : "👁️"}
//           </span>
//         </div>

//         {/* Login Button */}
//         <button
//           onClick={login}
//           disabled={loading}
//           style={styles.primaryBtn}
//           className="primaryBtn"
//         >
//           {loading ? <span className="btnSpinner"></span> : "Login →"}
//         </button>

//         <div style={styles.divider}>
//           <div style={styles.divLine}></div>
//           <span style={styles.divText}>or</span>
//           <div style={styles.divLine}></div>
//         </div>

//         {/* Google */}
//         <button
//           onClick={googleLogin}
//           disabled={loading}
//           style={styles.googleBtn}
//           className="googleBtn"
//         >
//           <img
//             src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
//             alt="Google"
//             style={{ width: 20, height: 20 }}
//           />
//           Continue with Google
//         </button>

//         <p style={styles.footerText}>
//           Don&apos;t have an account?{" "}
//           <Link to="/signup" style={styles.link}>Sign Up</Link>
//         </p>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   page: {
//     minHeight: "100vh",
//     background: "#020617",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     fontFamily: "'Inter', 'Segoe UI', sans-serif",
//     position: "relative",
//     overflow: "hidden",
//     padding: "20px",
//   },
//   glow1: {
//     position: "fixed", top: -150, left: "10%",
//     width: 500, height: 500,
//     background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)",
//     borderRadius: "50%", pointerEvents: "none",
//   },
//   glow2: {
//     position: "fixed", bottom: -150, right: "10%",
//     width: 400, height: 400,
//     background: "radial-gradient(circle, rgba(245,158,11,0.13), transparent 70%)",
//     borderRadius: "50%", pointerEvents: "none",
//   },
//   card: {
//     width: "100%",
//     maxWidth: 420,
//     padding: "40px 36px",
//     borderRadius: 24,
//     position: "relative",
//     zIndex: 1,
//   },
//   logoWrap: {
//     display: "flex", alignItems: "center",
//     gap: 10, marginBottom: 6,
//   },
//   logo: {
//     fontSize: 36, fontWeight: 800, letterSpacing: -1,
//     background: "linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)",
//     WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
//   },
//   subtitle: {
//     color: "#64748b", fontSize: 14, margin: "0 0 28px",
//   },
//   inputGroup: {
//     position: "relative", marginBottom: 16,
//     display: "flex", alignItems: "center",
//   },
//   inputIcon: {
//     position: "absolute", left: 14, fontSize: 16, zIndex: 1,
//   },
//   input: {
//     width: "100%", padding: "14px 14px 14px 44px",
//     background: "rgba(255,255,255,0.04)",
//     border: "1px solid rgba(255,255,255,0.08)",
//     borderRadius: 12, color: "white", fontSize: 15,
//     outline: "none", boxSizing: "border-box",
//     transition: "border-color 0.2s",
//   },
//   eyeIcon: {
//     position: "absolute", right: 14, cursor: "pointer", fontSize: 16,
//   },
//   primaryBtn: {
//     width: "100%", padding: "15px",
//     background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
//     border: "none", borderRadius: 12,
//     color: "white", fontSize: 16, fontWeight: 700,
//     cursor: "pointer", marginBottom: 20,
//     display: "flex", alignItems: "center", justifyContent: "center",
//     gap: 8,
//   },
//   divider: {
//     display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
//   },
//   divLine: {
//     flex: 1, height: 1, background: "rgba(255,255,255,0.08)",
//   },
//   divText: { color: "#475569", fontSize: 13 },
//   googleBtn: {
//     width: "100%", padding: "13px",
//     background: "rgba(255,255,255,0.05)",
//     border: "1px solid rgba(255,255,255,0.1)",
//     borderRadius: 12, color: "white",
//     fontSize: 15, fontWeight: 600, cursor: "pointer",
//     display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
//     marginBottom: 24,
//   },
//   footerText: { color: "#64748b", fontSize: 14, textAlign: "center", margin: 0 },
//   link: { color: "#a78bfa", textDecoration: "none", fontWeight: 600 },
// };

// const css = `
//   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

//   .glassCard {
//     background: rgba(15,23,42,0.85);
//     border: 1px solid rgba(255,255,255,0.08);
//     backdrop-filter: blur(20px);
//   }
//   .glassInput:focus {
//     border-color: rgba(139,92,246,0.5) !important;
//     background: rgba(139,92,246,0.06) !important;
//   }
//   .glassInput::placeholder { color: #475569; }
//   .primaryBtn:hover:not(:disabled) {
//     background: linear-gradient(135deg, #7c3aed, #5b21b6) !important;
//     transform: translateY(-1px);
//     box-shadow: 0 8px 24px rgba(139,92,246,0.35);
//   }
//   .primaryBtn:disabled { opacity: 0.6; cursor: not-allowed; }
//   .googleBtn:hover:not(:disabled) {
//     background: rgba(255,255,255,0.09) !important;
//     border-color: rgba(255,255,255,0.18) !important;
//   }
//   @keyframes spin { to { transform: rotate(360deg); } }
//   .btnSpinner {
//     width: 20px; height: 20px;
//     border: 2px solid rgba(255,255,255,0.3);
//     border-top-color: white;
//     border-radius: 50%;
//     animation: spin 0.7s linear infinite;
//     display: inline-block;
//   }
// `;

// export default Login;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Hidden admin access — triple click on footer
  const [footerClicks, setFooterClicks] = useState(0);
  const handleFooterClick = () => {
    const next = footerClicks + 1;
    setFooterClicks(next);
    if (next >= 5) {
      setFooterClicks(0);
      navigate("/admin-login");
    }
  };

  const saveLoginHistory = async (user) => {
    try {
      await addDoc(collection(db, "loginHistory"), { uid: user.uid, email: user.email, loginTime: new Date() });
    } catch (e) { console.log(e); }
  };

  const login = async () => {
    if (!email || !password) { alert("Enter Email and Password"); return; }
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveLoginHistory(result.user);
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    } finally { setLoading(false); }
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveLoginHistory(result.user);
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    } finally { setLoading(false); }
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
        <p style={styles.subtitle}>Welcome back! Sign in to continue</p>

        <div style={styles.inputGroup}>
          <span style={styles.inputIcon}>📧</span>
          <input type="email" placeholder="Email address" value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input} className="glassInput" />
        </div>

        <div style={styles.inputGroup}>
          <span style={styles.inputIcon}>🔒</span>
          <input type={showPass ? "text" : "password"} placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            style={{ ...styles.input, paddingRight: 48 }} className="glassInput" />
          <span style={styles.eyeIcon} onClick={() => setShowPass(!showPass)}>
            {showPass ? "🙈" : "👁️"}
          </span>
        </div>

        <button onClick={login} disabled={loading} style={styles.primaryBtn} className="primaryBtn">
          {loading ? <span className="btnSpinner"></span> : "Login →"}
        </button>

        <div style={styles.divider}>
          <div style={styles.divLine}></div>
          <span style={styles.divText}>or</span>
          <div style={styles.divLine}></div>
        </div>

        <button onClick={googleLogin} disabled={loading} style={styles.googleBtn} className="googleBtn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 20, height: 20 }} />
          Continue with Google
        </button>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.link}>Sign Up</Link>
        </p>

        {/* Hidden admin trigger — 5 clicks on version text */}
        <p
          onClick={handleFooterClick}
          style={{ color: "#1e293b", fontSize: 10, textAlign: "center", marginTop: 24, cursor: "default", userSelect: "none" }}
        >
          v1.0.0
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#020617", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', 'Segoe UI', sans-serif", position: "relative", overflow: "hidden", padding: "20px" },
  glow1: { position: "fixed", top: -150, left: "10%", width: 500, height: 500, background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)", borderRadius: "50%", pointerEvents: "none" },
  glow2: { position: "fixed", bottom: -150, right: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(245,158,11,0.13), transparent 70%)", borderRadius: "50%", pointerEvents: "none" },
  card: { width: "100%", maxWidth: 420, padding: "40px 36px", borderRadius: 24, position: "relative", zIndex: 1 },
  logoWrap: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  logo: { fontSize: 36, fontWeight: 800, letterSpacing: -1, background: "linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  subtitle: { color: "#64748b", fontSize: 14, margin: "0 0 28px" },
  inputGroup: { position: "relative", marginBottom: 16, display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: 14, fontSize: 16, zIndex: 1 },
  input: { width: "100%", padding: "14px 14px 14px 44px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "white", fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
  eyeIcon: { position: "absolute", right: 14, cursor: "pointer", fontSize: 16 },
  primaryBtn: { width: "100%", padding: "15px", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", border: "none", borderRadius: 12, color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  divider: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  divLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.08)" },
  divText: { color: "#475569", fontSize: 13 },
  googleBtn: { width: "100%", padding: "13px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 },
  footerText: { color: "#64748b", fontSize: 14, textAlign: "center", margin: 0 },
  link: { color: "#a78bfa", textDecoration: "none", fontWeight: 600 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .glassCard { background: rgba(15,23,42,0.85); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px); }
  .glassInput:focus { border-color: rgba(139,92,246,0.5) !important; background: rgba(139,92,246,0.06) !important; }
  .glassInput::placeholder { color: #475569; }
  .primaryBtn:hover:not(:disabled) { background: linear-gradient(135deg, #7c3aed, #5b21b6) !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(139,92,246,0.35); }
  .primaryBtn:disabled { opacity: 0.6; cursor: not-allowed; }
  .googleBtn:hover:not(:disabled) { background: rgba(255,255,255,0.09) !important; border-color: rgba(255,255,255,0.18) !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .btnSpinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
`;

export default Login;