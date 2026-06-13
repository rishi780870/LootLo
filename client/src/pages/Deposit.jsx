import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Deposit() {
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserData(snap.data());
    } catch (e) {
      console.log(e);
    }
  };

  const sendTelegramMessage = async (name, email, amount, utr) => {
    try {
      const BOT_TOKEN = "8570117120:AAHlGf-zJIDJ5T1oRCEJDyASrDNWpES1C-8";
      const CHAT_ID = "7629976258";
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `🔥 NEW DEPOSIT REQUEST\n\n👤 Name: ${name}\n📧 Email: ${email}\n💰 Amount: ₹${amount}\n🧾 UTR: ${utr}\n\n⏳ Status: Pending`,
        }),
      });
    } catch (e) {
      console.log("Telegram Error:", e);
    }
  };

  const submitDeposit = async () => {
    if (!amount) { alert("Enter Amount"); return; }
    if (Number(amount) < 100) { alert("Minimum Deposit ₹100"); return; }
    if (!utr) { alert("Enter UTR Number"); return; }
    const user = auth.currentUser;
    if (!user) { alert("Login Required"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "depositRequests"), {
        uid: user.uid,
        name: userData?.name || "",
        email: userData?.email || "",
        amount: Number(amount),
        utr,
        status: "pending",
        createdAt: new Date(),
      });
      await sendTelegramMessage(userData?.name, userData?.email, amount, utr);
      alert("Deposit Request Submitted ✅\nWe'll credit your balance after verification.");
      setAmount("");
      setUtr("");
    } catch (e) {
      console.log(e);
      alert(e.message);
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
          <button onClick={() => navigate("/dashboard")} className="backBtn">← Back</button>
          <h1 style={styles.title}>💳 Deposit Funds</h1>
          <span></span>
        </div>

        {/* UPI Card */}
        <div style={styles.upiCard}>
          <div style={styles.upiTop}>
            <span style={{ fontSize: 32 }}>📱</span>
            <div>
              <p style={styles.upiLabel}>Pay to UPI ID</p>
              <h2 style={styles.upiId}>lootlo@upi</h2>
            </div>
          </div>
          <div style={styles.upiDivider}></div>
          <p style={styles.upiNote}>
            📌 Send money via any UPI app — PhonePe, GPay, Paytm, BHIM<br />
            Then enter amount & UTR below to submit your request.
          </p>
          <div style={styles.upiSteps}>
            {["Open any UPI app", "Send to lootlo@upi", "Copy the UTR / Ref No.", "Fill form below"].map((s, i) => (
              <div key={i} style={styles.step}>
                <div style={styles.stepNum}>{i + 1}</div>
                <span style={styles.stepText}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Submit Deposit Request</h3>

          {/* Quick amounts */}
          <p style={styles.fieldLabel}>Quick Amount</p>
          <div style={styles.quickRow}>
            {quickAmounts.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                className={amount === String(q) ? "qAmtActive" : "qAmt"}
              >
                ₹{q}
              </button>
            ))}
          </div>

          <p style={styles.fieldLabel}>Amount (₹)</p>
          <div style={styles.inputWrap}>
            <span style={styles.inputPre}>₹</span>
            <input
              type="number"
              placeholder="Enter amount (min ₹100)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
              className="dInput"
            />
          </div>

          <p style={styles.fieldLabel}>UTR / Reference Number</p>
          <div style={styles.inputWrap}>
            <span style={styles.inputPre}>🧾</span>
            <input
              type="text"
              placeholder="Enter UTR / Ref number from UPI app"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              style={styles.input}
              className="dInput"
            />
          </div>

          <button
            onClick={submitDeposit}
            disabled={loading}
            className="submitBtn"
          >
            {loading ? <span className="btnSpinner"></span> : "Submit Deposit Request →"}
          </button>

          <p style={styles.minNote}>⚠️ Minimum deposit: ₹100 · Processing time: 5–30 mins</p>
        </div>
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
    position: "fixed", top: -100, left: "15%", width: 350, height: 350,
    background: "radial-gradient(circle,rgba(16,185,129,0.12),transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  container: { maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px", position: "relative", zIndex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" },
  upiCard: {
    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 18, padding: "22px", marginBottom: 16,
  },
  upiTop: { display: "flex", alignItems: "center", gap: 14, marginBottom: 14 },
  upiLabel: { color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 4px" },
  upiId: { margin: 0, fontSize: 22, fontWeight: 800, color: "#10b981", letterSpacing: 1 },
  upiDivider: { height: 1, background: "rgba(16,185,129,0.15)", marginBottom: 14 },
  upiNote: { color: "#64748b", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" },
  upiSteps: { display: "flex", flexWrap: "wrap", gap: 10 },
  step: { display: "flex", alignItems: "center", gap: 8 },
  stepNum: {
    width: 22, height: 22, borderRadius: "50%",
    background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)",
    color: "#10b981", fontSize: 11, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  stepText: { color: "#94a3b8", fontSize: 12 },
  formCard: {
    background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18, padding: "24px", backdropFilter: "blur(10px)",
  },
  formTitle: { margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "#f1f5f9" },
  fieldLabel: { color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" },
  quickRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  inputWrap: { position: "relative", marginBottom: 16, display: "flex", alignItems: "center" },
  inputPre: { position: "absolute", left: 14, fontSize: 15, color: "#64748b" },
  input: {
    width: "100%", padding: "13px 13px 13px 40px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, color: "white", fontSize: 15,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  },
  minNote: { color: "#475569", fontSize: 12, textAlign: "center", margin: "12px 0 0" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  .backBtn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8; padding: 9px 16px; border-radius: 10px;
    cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;
  }
  .backBtn:hover { background: rgba(255,255,255,0.1); color: white; }
  .qAmt {
    padding: 7px 14px; border-radius: 8px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .qAmt:hover { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); color: #10b981; }
  .qAmtActive {
    padding: 7px 14px; border-radius: 8px;
    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4);
    color: #10b981; font-size: 13px; font-weight: 700; cursor: pointer;
  }
  .dInput:focus { border-color: rgba(16,185,129,0.4) !important; background: rgba(16,185,129,0.05) !important; }
  .dInput::placeholder { color: #475569; }
  .submitBtn {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none; border-radius: 12px; color: white;
    font-size: 16px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s;
  }
  .submitBtn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,0.3); }
  .submitBtn:disabled { opacity: 0.6; cursor: not-allowed; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .btnSpinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
`;

export default Deposit;