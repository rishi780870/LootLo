import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Withdraw() {
  const [userData, setUserData] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUserData(snap.data());
        // Auto-fill name from account
        setAccountName(snap.data().name || "");
      }
    });
    return () => unsubscribe();
  }, []);

  const submitWithdraw = async () => {
    if (!accountName.trim()) { alert("Enter Account Holder Name"); return; }
    if (!upiId.trim()) { alert("Enter UPI ID"); return; }
    if (!amount) { alert("Enter Amount"); return; }
    const withdrawAmount = Number(amount);
    if (withdrawAmount < 100) { alert("Minimum Withdraw ₹100"); return; }
    if (withdrawAmount > (userData?.balance || 0)) { alert("Insufficient Balance"); return; }
    const user = auth.currentUser;
    setLoading(true);
    try {
      await addDoc(collection(db, "withdrawRequests"), {
        uid: user.uid,
        name: userData.name,
        email: userData.email,
        accountName: accountName.trim(),
        upiId: upiId.trim(),
        amount: withdrawAmount,
        status: "pending",
        createdAt: new Date(),
      });
      await updateDoc(doc(db, "users", user.uid), {
        balance: (userData.balance || 0) - withdrawAmount,
        totalWithdraw: (userData.totalWithdraw || 0) + withdrawAmount,
      });
      alert("Withdraw Request Submitted ✅\nWe'll process it within 24 hours.");
      setAmount(""); setUpiId(""); setAccountName(userData.name || "");
      const updatedSnap = await getDoc(doc(db, "users", user.uid));
      if (updatedSnap.exists()) setUserData(updatedSnap.data());
    } catch (e) {
      console.log(e); alert(e.message);
    } finally { setLoading(false); }
  };

  if (!userData) {
    return (
      <div style={styles.loading}>
        <style>{css}</style>
        <div className="spinner"></div>
        <p style={{ color: "#64748b", marginTop: 14 }}>Loading...</p>
      </div>
    );
  }

  const balance = userData.balance || 0;

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.glow}></div>
      <div style={styles.container}>

        <div style={styles.header}>
          <button onClick={() => navigate("/dashboard")} className="backBtn">← Back</button>
          <h1 style={styles.title}>💸 Withdraw</h1>
          <span></span>
        </div>

        {/* Balance Card */}
        <div style={styles.balCard}>
          <div style={styles.balTop}>
            <span style={{ fontSize: 28 }}>💰</span>
            <div>
              <p style={styles.balLabel}>Available Balance</p>
              <h2 style={styles.balAmount}>₹{balance.toLocaleString()}</h2>
            </div>
          </div>
          {balance < 100 && (
            <div style={styles.warningBox}>⚠️ Minimum balance ₹100 required to withdraw</div>
          )}
        </div>

        {/* Form */}
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Withdraw Request</h3>

          {/* Account Holder Name */}
          <p style={styles.fieldLabel}>Account Holder Name</p>
          <div style={styles.inputWrap}>
            <span style={styles.inputPre}>👤</span>
            <input
              type="text"
              placeholder="Enter name as per bank/UPI"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              style={styles.input}
              className="wInput"
            />
          </div>

          {/* UPI ID */}
          <p style={styles.fieldLabel}>UPI ID</p>
          <div style={styles.inputWrap}>
            <span style={styles.inputPre}>🏦</span>
            <input
              type="text"
              placeholder="yourname@upi / yourname@bank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              style={styles.input}
              className="wInput"
            />
          </div>

          {/* Quick Amount */}
          <p style={styles.fieldLabel}>Quick Amount</p>
          <div style={styles.quickRow}>
            {quickAmounts.map((q) => (
              <button key={q} onClick={() => setAmount(String(Math.min(q, balance)))} disabled={q > balance} className={amount === String(q) || amount === String(Math.min(q, balance)) ? "qAmtActive" : "qAmt"}>
                ₹{q}
              </button>
            ))}
          </div>

          {/* Amount */}
          <p style={styles.fieldLabel}>Amount (₹)</p>
          <div style={styles.inputWrap}>
            <span style={styles.inputPre}>₹</span>
            <input
              type="number"
              placeholder={`Min ₹100 · Max ₹${balance}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
              className="wInput"
            />
            <button onClick={() => setAmount(String(balance))} className="maxBtn">MAX</button>
          </div>

          {/* Preview */}
          {accountName && upiId && amount && Number(amount) >= 100 && (
            <div style={styles.previewBox}>
              <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Request Summary</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>Name</span>
                <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{accountName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>UPI ID</span>
                <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{upiId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>Amount</span>
                <span style={{ color: "#f97316", fontWeight: 800, fontSize: 16 }}>₹{Number(amount).toLocaleString()}</span>
              </div>
            </div>
          )}

          <button onClick={submitWithdraw} disabled={loading || balance < 100} className="submitBtn">
            {loading ? <span className="btnSpinner"></span> : "Submit Withdraw Request →"}
          </button>

          <p style={styles.minNote}>⚠️ Min ₹100 · Processing: up to 24 hrs · Goes to your UPI</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#020617", color: "white", fontFamily: "'Inter','Segoe UI',sans-serif", position: "relative" },
  loading: { minHeight: "100vh", background: "#020617", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" },
  glow: { position: "fixed", top: -100, right: "15%", width: 350, height: 350, background: "radial-gradient(circle,rgba(249,115,22,0.12),transparent 70%)", borderRadius: "50%", pointerEvents: "none" },
  container: { maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  balCard: { background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 18, padding: "20px", marginBottom: 16 },
  balTop: { display: "flex", alignItems: "center", gap: 14 },
  balLabel: { color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 4px" },
  balAmount: { margin: 0, fontSize: 30, fontWeight: 800, color: "#f97316" },
  warningBox: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 14px", color: "#f59e0b", fontSize: 13, marginTop: 14 },
  formCard: { background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "24px", backdropFilter: "blur(10px)" },
  formTitle: { margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "#f1f5f9" },
  fieldLabel: { color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" },
  quickRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  inputWrap: { position: "relative", marginBottom: 16, display: "flex", alignItems: "center" },
  inputPre: { position: "absolute", left: 14, fontSize: 15, color: "#64748b" },
  input: { width: "100%", padding: "13px 13px 13px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "white", fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
  previewBox: { background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 12, padding: "14px", marginBottom: 16 },
  minNote: { color: "#475569", fontSize: 12, textAlign: "center", margin: "12px 0 0" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .backBtn { background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;padding:9px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.2s; }
  .backBtn:hover { background:rgba(255,255,255,0.1);color:white; }
  .qAmt { padding:7px 14px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s; }
  .qAmt:hover:not(:disabled) { background:rgba(249,115,22,0.1);border-color:rgba(249,115,22,0.25);color:#f97316; }
  .qAmt:disabled { opacity:0.35;cursor:not-allowed; }
  .qAmtActive { padding:7px 14px;border-radius:8px;background:rgba(249,115,22,0.15);border:2px solid rgba(249,115,22,0.5);color:#f97316;font-size:13px;font-weight:700;cursor:pointer; }
  .wInput:focus { border-color:rgba(249,115,22,0.4) !important;background:rgba(249,115,22,0.05) !important; }
  .wInput::placeholder { color:#475569; }
  .maxBtn { position:absolute;right:12px;background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.3);color:#f97316;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer; }
  .submitBtn { width:100%;padding:15px;background:linear-gradient(135deg,#f97316,#ea580c);border:none;border-radius:12px;color:white;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;margin-top:4px; }
  .submitBtn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 8px 24px rgba(249,115,22,0.3); }
  .submitBtn:disabled { opacity:0.5;cursor:not-allowed; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .btnSpinner { width:20px;height:20px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block; }
  .spinner { width:30px;height:30px;margin:0 auto;border:3px solid rgba(249,115,22,0.2);border-top-color:#f97316;border-radius:50%;animation:spin 0.8s linear infinite; }
`;

export default Withdraw;