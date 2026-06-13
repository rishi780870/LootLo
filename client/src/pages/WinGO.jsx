import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  doc, getDoc, updateDoc, addDoc, deleteDoc, collection,
  query, orderBy, limit, onSnapshot, where,
} from "firebase/firestore";

function getColor(num) {
  if ([0, 5].includes(num)) return "#a855f7";
  if ([1, 3, 7, 9].includes(num)) return "#22c55e";
  return "#ef4444";
}
function getColorLabel(num) {
  if ([0, 5].includes(num)) return "Violet";
  if ([1, 3, 7, 9].includes(num)) return "Green";
  return "Red";
}

// ── Sound ────────────────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    if (type === "win") {
      o.frequency.setValueAtTime(523, ctx.currentTime);
      o.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      o.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      o.frequency.setValueAtTime(1047, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      o.start(); o.stop(ctx.currentTime + 0.6);
    } else if (type === "lose") {
      o.frequency.setValueAtTime(300, ctx.currentTime);
      o.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } else if (type === "bet") {
      o.frequency.setValueAtTime(440, ctx.currentTime);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.start(); o.stop(ctx.currentTime + 0.15);
    } else if (type === "tick") {
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.type = "square";
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      o.start(); o.stop(ctx.currentTime + 0.08);
    } else if (type === "cancel") {
      o.frequency.setValueAtTime(350, ctx.currentTime);
      o.frequency.setValueAtTime(250, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      o.start(); o.stop(ctx.currentTime + 0.25);
    } else if (type === "shuffle") {
      o.frequency.setValueAtTime(600 + Math.random() * 400, ctx.currentTime);
      o.type = "square";
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      o.start(); o.stop(ctx.currentTime + 0.06);
    }
  } catch (e) {}
}

// ── Toast ────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 99999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "win" ? "linear-gradient(135deg,#14532d,#166534)" : t.type === "lose" ? "linear-gradient(135deg,#7f1d1d,#991b1b)" : "linear-gradient(135deg,#1e3a5f,#1e40af)",
          border: `1px solid ${t.type === "win" ? "#22c55e" : t.type === "lose" ? "#ef4444" : "#3b82f6"}`,
          borderRadius: 14, padding: "14px 20px", color: "white",
          fontSize: 15, fontWeight: 700, minWidth: 220,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "slideIn 0.3s ease",
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Shuffle Animation Component ───────────────────────────────────────
function ShuffleDisplay({ finalResult, onDone, soundOn }) {
  const [displayNum, setDisplayNum] = useState(Math.floor(Math.random() * 10));
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let speed = 60;
    let elapsed = 0;
    const totalDuration = 3000; // 3 seconds shuffle

    const tick = () => {
      elapsed += speed;
      setDisplayNum(Math.floor(Math.random() * 10));
      if (soundOn) playSound("shuffle");

      // Slow down near end
      if (elapsed > totalDuration * 0.6) speed = 120;
      if (elapsed > totalDuration * 0.8) speed = 220;
      if (elapsed > totalDuration * 0.92) speed = 400;

      if (elapsed >= totalDuration) {
        clearTimeout(timeoutRef.current);
        setDisplayNum(finalResult);
        setDone(true);
        setTimeout(() => onDone(), 800);
        return;
      }
      timeoutRef.current = setTimeout(tick, speed);
    };

    timeoutRef.current = setTimeout(tick, speed);
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const color = done ? getColor(finalResult) : "#f59e0b";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "20px 0",
    }}>
      <p style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 16px" }}>
        {done ? "Result!" : "🎲 Rolling..."}
      </p>
      <div style={{
        width: 90, height: 90, borderRadius: "50%",
        background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 42, fontWeight: 900, color: "white",
        boxShadow: `0 0 40px ${color}99`,
        transition: done ? "all 0.4s ease" : "background 0.08s",
        transform: done ? "scale(1.15)" : "scale(1)",
        animation: done ? "none" : "shufflePulse 0.12s ease infinite alternate",
      }}>
        {displayNum}
      </div>
      {done && (
        <div style={{
          marginTop: 14, fontSize: 16, fontWeight: 700,
          color: color, animation: "fadeIn 0.4s ease",
        }}>
          {getColorLabel(finalResult)} · {finalResult >= 5 ? "Big" : "Small"}
        </div>
      )}
    </div>
  );
}

// ── Win/Loss Result Card ──────────────────────────────────────────────
function WinLossCard({ bet, result }) {
  if (!bet || bet.status === "pending") return null;

  const won = bet.status === "won";

  return (
    <div style={{
      background: won
        ? "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(43,50,112,1))"
        : "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(43,50,112,1))",
      border: `2px solid ${won ? "#22c55e" : "#ef4444"}`,
      borderRadius: 20, padding: "22px 20px", marginBottom: 12,
      animation: "bounceIn 0.5s ease",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>
        {won ? "🎉" : "😢"}
      </div>
      <div style={{
        fontSize: 26, fontWeight: 900,
        color: won ? "#22c55e" : "#ef4444",
        marginBottom: 6,
      }}>
        {won ? `+₹${bet.payout} Won!` : `-₹${bet.amount} Lost`}
      </div>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>
        Your bet: <strong style={{ color: "white" }}>
          {bet.type === "number" ? `Number ${bet.value}` : bet.value}
        </strong>
        {" "}· Result: <strong style={{ color: getColor(result) }}>{result} ({getColorLabel(result)})</strong>
      </div>
    </div>
  );
}

export default function WinGo() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState("");

  const [gameState, setGameState] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState("betting");

  const [betAmount, setBetAmount] = useState(50);
  const [showModal, setShowModal] = useState(false);
  const [pendingBet, setPendingBet] = useState(null);
  const [betLoading, setBetLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [autoBet, setAutoBet] = useState(false);
  const [autoBetCount, setAutoBetCount] = useState(3);
  const [selectedBet, setSelectedBet] = useState(null);
  const autoBetRef = useRef(false);

  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(true);
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);

  const [history, setHistory] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [tab, setTab] = useState("game");

  // ── Shuffle state ─────────────────────────────────────────────────
  const [showShuffle, setShowShuffle] = useState(false);
  const [shuffleFinalResult, setShuffleFinalResult] = useState(null);

  // ── Win/Loss popup state ──────────────────────────────────────────
  const [resultBet, setResultBet] = useState(null); // the settled bet to show
  const [showResultCard, setShowResultCard] = useState(false);

  // ── Optimistic bet ────────────────────────────────────────────────
  const [optimisticBet, setOptimisticBet] = useState(null);
  const firestoreDocIdRef = useRef(null);

  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  // ── Auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/"); return; }
      setUser(u);
    });
    return () => unsub();
  }, [navigate]);

  // ── User stats live ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setBalance(d.balance || 0);
        setUserName(d.name || "");
        setMyStats({ wins: d.wingoWins || 0, losses: d.wingoLosses || 0, totalWinnings: d.totalWinnings || 0 });
      }
    });
    return () => unsub();
  }, [user]);

  // ── Game state ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "gameState", "current"), (snap) => {
      if (!snap.exists()) return;
      const g = snap.data();
      setGameState(g);
      setPhase(g.phase || "betting");
      if (g.phase === "betting") {
        const elapsed = Math.floor((Date.now() - g.startTime) / 1000);
        setTimeLeft(Math.max(30 - elapsed, 0));
      } else {
        setTimeLeft(0);
      }
    });
    return () => unsub();
  }, []);

  // ── Timer countdown ───────────────────────────────────────────────
  const prevSecsRef = useRef(99);
  useEffect(() => {
    if (!gameState) return;
    const timer = setInterval(() => {
      if (gameState.phase === "betting") {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const remaining = Math.max(30 - elapsed, 0);
        setTimeLeft(remaining);
        if (remaining <= 5 && remaining > 0 && remaining !== prevSecsRef.current && soundRef.current) {
          playSound("tick");
        }
        prevSecsRef.current = remaining;
      } else {
        setTimeLeft(0);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [gameState]);

  // ── Phase change: betting→result trigger shuffle ──────────────────
  const prevPhaseRef = useRef("betting");
  const prevPeriodRef2 = useRef(null);

  useEffect(() => {
    if (!gameState || !user) return;

    // Betting phase started (new round)
    if (gameState.phase === "betting" && prevPhaseRef.current === "result") {
      setShowShuffle(false);
      setShowResultCard(false);
      setResultBet(null);
    }

    // Result phase started → show shuffle animation
    if (gameState.phase === "result" && prevPhaseRef.current === "betting") {
      if (gameState.result !== undefined && gameState.result !== null) {
        setShuffleFinalResult(gameState.result);
        setShowShuffle(true);
        setShowResultCard(false);
      }
    }

    prevPhaseRef.current = gameState.phase;
  }, [gameState?.phase, gameState?.period]);

  // ── After shuffle done: show win/loss card ────────────────────────
  const onShuffleDone = () => {
    setShowShuffle(false);

    // Find the settled bet for this period
    const settled = myBets.find(
      b => b.period === gameState?.period && (b.status === "won" || b.status === "lost")
    );

    if (settled) {
      setResultBet(settled);
      setShowResultCard(true);
      if (settled.status === "won") {
        if (soundRef.current) playSound("win");
        addToast(`🎉 You Won ₹${settled.payout}!`, "win");
      } else {
        if (soundRef.current) playSound("lose");
        addToast(`😢 Lost ₹${settled.amount}`, "lose");
      }
    }
  };

  // ── Also check myBets for result after shuffle if bet settles late ─
  useEffect(() => {
    if (!showResultCard && !showShuffle && gameState?.phase === "result") {
      const settled = myBets.find(
        b => b.period === gameState?.period && (b.status === "won" || b.status === "lost")
      );
      if (settled && !resultBet) {
        setResultBet(settled);
        setShowResultCard(true);
        if (settled.status === "won") {
          if (soundRef.current) playSound("win");
          addToast(`🎉 You Won ₹${settled.payout}!`, "win");
        } else {
          if (soundRef.current) playSound("lose");
          addToast(`😢 Lost ₹${settled.amount}`, "lose");
        }
      }
    }
  }, [myBets, gameState?.phase]);

  // ── Clear optimistic bet ──────────────────────────────────────────
  useEffect(() => {
    if (!optimisticBet || !gameState) return;
    const confirmed = myBets.find(b => b.period === gameState.period && b.status === "pending");
    if (confirmed) setOptimisticBet(null);
  }, [myBets, optimisticBet, gameState]);

  useEffect(() => {
    if (!gameState) return;
    if (optimisticBet && optimisticBet.period !== gameState.period) setOptimisticBet(null);
  }, [gameState?.period]);

  // ── History ───────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "wingoHistory"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, snap => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  // ── My bets ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "userBets"), where("uid", "==", user.uid), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, snap => setMyBets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

  // ── Live feed ─────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "userBets"), orderBy("createdAt", "desc"), limit(8));
    const unsub = onSnapshot(q, snap => setLiveFeed(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  // ── Leaderboard ───────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "leaderboard", "wingo"), snap => {
      if (snap.exists()) setLeaderboard(snap.data().top10 || []);
    });
    return () => unsub();
  }, []);

  // ── Derived ───────────────────────────────────────────────────────
  const firestoreBet = myBets.find(b => b.period === gameState?.period && b.status === "pending");
  const currentBet = optimisticBet ?? firestoreBet;
  const hasActiveBet = !!currentBet;
  const canCancelBet = currentBet && phase === "betting" && timeLeft > 5;

  // ── Auto-bet ──────────────────────────────────────────────────────
  useEffect(() => { autoBetRef.current = autoBet; }, [autoBet]);
  const prevPeriodRef = useRef(null);
  useEffect(() => {
    if (!gameState || !user) return;
    if (gameState.phase === "betting" && gameState.period !== prevPeriodRef.current) {
      prevPeriodRef.current = gameState.period;
      if (autoBetRef.current && selectedBet && autoBetCount > 0) {
        setTimeout(() => {
          placeBetDirect(selectedBet);
          setAutoBetCount(c => {
            const newC = c - 1;
            if (newC <= 0) setAutoBet(false);
            return newC;
          });
        }, 1500);
      }
    }
  }, [gameState?.period]);

  // ── Open modal ────────────────────────────────────────────────────
  const openBetModal = (type, value) => {
    if (bettingLocked) { addToast("⏳ Bets are locked!", "info"); return; }
    if (hasActiveBet) { addToast("⚠️ You already have an active bet this round!", "info"); return; }
    setPendingBet({ type, value });
    setSelectedBet({ type, value });
    setShowModal(true);
  };

  // ── Place bet ─────────────────────────────────────────────────────
  const placeBetDirect = async (bet) => {
    if (!user || !gameState) return;
    const existingFirestore = myBets.find(b => b.period === gameState.period && b.status === "pending");
    if (existingFirestore || optimisticBet) { addToast("⚠️ You already have an active bet!", "info"); return; }
    if (betAmount > balance) { addToast("❌ Insufficient balance!", "lose"); return; }
    if (betAmount < 10) { addToast("❌ Minimum bet ₹10", "lose"); return; }
    if (betAmount > 8000) { addToast("❌ Maximum bet ₹8000", "lose"); return; }

    const optimistic = {
      id: "__optimistic__", uid: user.uid, userName,
      period: gameState.period, type: bet.type, value: bet.value,
      amount: betAmount, status: "pending", optimistic: true, createdAt: new Date(),
    };
    setOptimisticBet(optimistic);
    setBalance(prev => prev - betAmount);
    setBetLoading(true);

    try {
      const freshSnap = await getDoc(doc(db, "users", user.uid));
      const freshBalance = freshSnap.exists() ? (freshSnap.data().balance || 0) : balance;
      if (betAmount > freshBalance) {
        setOptimisticBet(null); setBalance(freshBalance);
        addToast("❌ Insufficient balance!", "lose"); setBetLoading(false); return;
      }
      await updateDoc(doc(db, "users", user.uid), { balance: freshBalance - betAmount });
      const betDocRef = await addDoc(collection(db, "userBets"), {
        uid: user.uid, userName, period: gameState.period,
        type: bet.type, value: bet.value, amount: betAmount,
        status: "pending", createdAt: new Date(),
      });
      firestoreDocIdRef.current = betDocRef.id;
      if (soundRef.current) playSound("bet");
      addToast(`✅ Bet placed: ${bet.type === "number" ? `#${bet.value}` : bet.value} — ₹${betAmount}`, "info");
    } catch (e) {
      setOptimisticBet(null);
      firestoreDocIdRef.current = null;
      setBalance(prev => prev + betAmount);
      addToast("❌ Error placing bet. Try again.", "lose");
    } finally {
      setBetLoading(false);
    }
  };

  const confirmBet = async () => {
    if (!pendingBet) return;
    await placeBetDirect(pendingBet);
    setShowModal(false);
  };

  // ── Cancel bet ────────────────────────────────────────────────────
  const cancelBet = async () => {
    if (!currentBet || !user) return;
    if (phase !== "betting" || timeLeft <= 5) { addToast("⏳ Too late to cancel!", "lose"); return; }
    const betToCancel = currentBet;
    const docIdToDelete = betToCancel.optimistic ? firestoreDocIdRef.current : betToCancel.id;
    setOptimisticBet(null);
    firestoreDocIdRef.current = null;
    setBalance(prev => prev + betToCancel.amount);
    setCancelLoading(true);
    try {
      const freshSnap = await getDoc(doc(db, "users", user.uid));
      const freshBalance = freshSnap.exists() ? (freshSnap.data().balance || 0) : balance;
      await updateDoc(doc(db, "users", user.uid), { balance: freshBalance + betToCancel.amount });
      if (docIdToDelete) await deleteDoc(doc(db, "userBets", docIdToDelete));
      if (soundRef.current) playSound("cancel");
      addToast(`↩️ Bet cancelled — ₹${betToCancel.amount} refunded`, "info");
      setSelectedBet(null);
    } catch (e) {
      setOptimisticBet(betToCancel);
      setBalance(prev => prev - betToCancel.amount);
      addToast("❌ Error cancelling. Try again.", "lose");
    } finally {
      setCancelLoading(false);
    }
  };

  const bettingLocked = phase !== "betting" || timeLeft <= 3;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  const getMultiplier = (type, value) => {
    if (type === "number") return "9x";
    if (type === "color" && value === "Violet") return "4.5x";
    return "2x";
  };
  const getPotential = (type, value) => {
    if (type === "number") return betAmount * 9;
    if (type === "color" && value === "Violet") return Math.floor(betAmount * 4.5);
    return betAmount * 2;
  };

  return (
    <div style={S.page}>
      <style>{css}</style>
      <Toast toasts={toasts} />

      {/* ── Bet Modal ── */}
      {showModal && pendingBet && (
        <div style={S.overlay} onClick={() => setShowModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={S.modalTitle}>Confirm Bet</h3>
            <div style={S.modalRow}>
              <span style={S.modalLbl}>Betting on</span>
              <span style={{ ...S.modalVal, color: pendingBet.type === "color" ? (pendingBet.value === "Green" ? "#22c55e" : pendingBet.value === "Violet" ? "#a855f7" : "#ef4444") : "#f59e0b", fontSize: 20 }}>
                {pendingBet.type === "number" ? `Number ${pendingBet.value}` : pendingBet.value}
              </span>
            </div>
            <div style={S.modalRow}>
              <span style={S.modalLbl}>Amount</span>
              <span style={{ ...S.modalVal, color: "#f1f5f9" }}>₹{betAmount}</span>
            </div>
            <div style={S.modalRow}>
              <span style={S.modalLbl}>Multiplier</span>
              <span style={{ ...S.modalVal, color: "#f59e0b" }}>{getMultiplier(pendingBet.type, pendingBet.value)}</span>
            </div>
            <div style={{ ...S.modalRow, borderBottom: "none" }}>
              <span style={S.modalLbl}>Potential Win</span>
              <span style={{ ...S.modalVal, color: "#22c55e", fontSize: 22, fontWeight: 800 }}>₹{getPotential(pendingBet.type, pendingBet.value)}</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} className="modalCancel">Cancel</button>
              <button onClick={confirmBet} disabled={betLoading} className="modalConfirm">
                {betLoading ? <span className="btnSpinner"></span> : "✅ Confirm Bet"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={S.wrap}>

        {/* Header */}
        <div style={S.header}>
          <button onClick={() => navigate("/dashboard")} className="backBtn">← Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setSoundOn(!soundOn)} className="iconBtn">{soundOn ? "🔊" : "🔇"}</button>
            <div style={S.balPill}>💰 ₹{balance.toLocaleString()}</div>
            <button onClick={() => navigate("/deposit")} className="depositBtn">+ Deposit</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={S.tabRow}>
          {[["game","🎯 Game"],["leaderboard","🏆 Top"],["stats","📊 Stats"]].map(([k,lbl]) => (
            <button key={k} onClick={() => setTab(k)} className={tab === k ? "tabActive" : "tab"}>{lbl}</button>
          ))}
        </div>

        {/* ── GAME TAB ── */}
        {tab === "game" && (
          <>
            {/* Timer Card */}
            <div style={S.timerCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={S.lbl}>Period</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>#{gameState?.period || "—"}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ ...S.lbl, color: bettingLocked ? "#ef4444" : "#22c55e" }}>
                    {phase === "result" ? "🎲 Drawing..." : bettingLocked ? "🔒 Bets Locked" : "✅ Bets Open"}
                  </p>
                  <div style={{
                    fontSize: 40, fontWeight: 800, fontFamily: "monospace",
                    color: phase === "result" ? "#a855f7" : timeLeft <= 5 ? "#ef4444" : "#f59e0b",
                    letterSpacing: 2,
                  }}>
                    {phase === "result" ? "🎲" : `${mins}:${secs}`}
                  </div>
                </div>
              </div>

              {/* ── SHUFFLE ANIMATION ── */}
              {showShuffle && shuffleFinalResult !== null && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 4 }}>
                  <ShuffleDisplay
                    finalResult={shuffleFinalResult}
                    onDone={onShuffleDone}
                    soundOn={soundRef.current}
                  />
                </div>
              )}

              {/* ── STATIC RESULT (after shuffle done, during result phase) ── */}
              {!showShuffle && phase === "result" && gameState?.result !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>Round Result:</span>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: getColor(gameState.result),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: 20, color: "white",
                    boxShadow: `0 0 20px ${getColor(gameState.result)}88`,
                  }}>
                    {gameState.result}
                  </div>
                  <span style={{ color: getColor(gameState.result), fontWeight: 700, fontSize: 16 }}>
                    {getColorLabel(gameState.result)} · {gameState.resultSize}
                  </span>
                </div>
              )}
            </div>

            {/* ── WIN/LOSS RESULT CARD ── */}
            {showResultCard && resultBet && gameState?.result !== undefined && (
              <WinLossCard bet={resultBet} result={gameState.result} />
            )}

            {/* Recent Results */}
            <div style={S.card}>
              <p style={S.lbl}>Recent Results</p>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {history.slice(0, 14).map(h => (
                  <div key={h.id} style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: getColor(h.result),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 14, color: "white",
                    boxShadow: `0 2px 8px ${getColor(h.result)}66`,
                  }}>
                    {h.result}
                  </div>
                ))}
              </div>
            </div>

            {/* ── ACTIVE BET CARD ── */}
            {hasActiveBet && (
              <div style={S.activeBetCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <p style={{ ...S.lbl, margin: 0, color: "#f59e0b" }}>
                    🎯 Your Active Bet — Round #{currentBet.period}
                  </p>
                  {canCancelBet
                    ? <span style={{ fontSize: 11, color: "#64748b" }}>Cancel window: {Math.max(timeLeft - 5, 0)}s left</span>
                    : <span style={{ fontSize: 11, color: "#ef4444" }}>🔒 Locked</span>
                  }
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{
                      fontSize: 18, fontWeight: 800,
                      color: currentBet.type === "color"
                        ? (currentBet.value === "Green" ? "#22c55e" : currentBet.value === "Violet" ? "#a855f7" : "#ef4444")
                        : "#f59e0b",
                    }}>
                      {currentBet.type === "number" ? `Number ${currentBet.value}` : currentBet.value}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                      {getMultiplier(currentBet.type, currentBet.value)} multiplier
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>₹{currentBet.amount}</div>
                    <div style={{ color: "#22c55e", fontSize: 12, marginTop: 2 }}>
                      Win: ₹{currentBet.type === "number" ? currentBet.amount * 9 : currentBet.value === "Violet" ? Math.floor(currentBet.amount * 4.5) : currentBet.amount * 2}
                    </div>
                  </div>
                </div>
                {canCancelBet ? (
                  <button onClick={cancelBet} disabled={cancelLoading} className="cancelBetBtn">
                    {cancelLoading ? <span className="btnSpinner"></span> : "❌ Cancel Bet & Refund"}
                  </button>
                ) : (
                  <div style={S.lockedNote}>⏳ Cancellation closed — bet is locked for this round</div>
                )}
              </div>
            )}

            {/* Betting Card */}
            <div style={S.card}>
              <p style={S.lbl}>Quick Bet Amount</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {quickAmounts.map(q => (
                  <button key={q} disabled={hasActiveBet} onClick={() => setBetAmount(q)} className={betAmount === q ? "qAmtActive" : "qAmt"}>₹{q}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>Custom:</span>
                <input type="number" value={betAmount} min={10} max={8000} disabled={hasActiveBet}
                  onChange={e => setBetAmount(Number(e.target.value))} className="amtInput" />
              </div>

              {hasActiveBet && (
                <div style={S.infoNote}>
                  ℹ️ One bet per round. Wait for round to finish or cancel your bet.
                </div>
              )}

              {/* Color Buttons */}
              <p style={S.lbl}>Color</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("color","Green")} className="betBtnGreen">🟢 Green <span style={{ fontSize: 11, opacity: 0.85 }}>2x</span></button>
                <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("color","Violet")} className="betBtnViolet">🟣 Violet <span style={{ fontSize: 11, opacity: 0.85 }}>4.5x</span></button>
                <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("color","Red")} className="betBtnRed">🔴 Red <span style={{ fontSize: 11, opacity: 0.85 }}>2x</span></button>
              </div>

              {/* Number Buttons */}
              <p style={S.lbl}>Number (9x)</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 18 }}>
                {[0,1,2,3,4,5,6,7,8,9].map(n => (
                  <button key={n} disabled={bettingLocked || hasActiveBet}
                    onClick={() => openBetModal("number", n)}
                    style={{
                      padding: "14px 0", borderRadius: 12, border: "none",
                      fontSize: 18, fontWeight: 800,
                      cursor: (bettingLocked || hasActiveBet) ? "not-allowed" : "pointer",
                      opacity: (bettingLocked || hasActiveBet) ? 0.45 : 1,
                      color: "white",
                      background: [0,5].includes(n) ? "#9333ea" : [1,3,7,9].includes(n) ? "#16a34a" : "#dc2626",
                      boxShadow: (bettingLocked || hasActiveBet) ? "none" : `0 4px 12px ${[0,5].includes(n) ? "#9333ea88" : [1,3,7,9].includes(n) ? "#16a34a88" : "#dc262688"}`,
                      transition: "all 0.15s",
                    }}
                    className="numBtn"
                  >{n}</button>
                ))}
              </div>

              {/* Size Buttons */}
              <p style={S.lbl}>Size (2x)</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("size","Big")} className="betBtnBig">🔼 Big</button>
                <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("size","Small")} className="betBtnSmall">🔽 Small</button>
              </div>

              {/* Auto-bet */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>Auto-Bet</span>
                  <button onClick={() => { if (!selectedBet) { addToast("Select a bet type first", "info"); return; } setAutoBet(!autoBet); }} className={autoBet ? "autoBetOn" : "autoBetOff"}>
                    {autoBet ? "ON 🟢" : "OFF ⚫"}
                  </button>
                </div>
                {autoBet && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>Rounds:</span>
                    <input type="number" value={autoBetCount} min={1} max={50}
                      onChange={e => setAutoBetCount(Number(e.target.value))} className="amtInput" style={{ width: 60 }} />
                  </div>
                )}
              </div>
            </div>

            {/* Live Feed */}
            <div style={S.card}>
              <p style={S.lbl}>⚡ Live Activity</p>
              {liveFeed.slice(0,6).map(f => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>
                    {f.userName?.[0] || "?"}
                  </div>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>
                    <strong style={{ color: "#e2e8f0" }}>{f.userName || "Player"}</strong> bet{" "}
                    <strong style={{ color: "#f59e0b" }}>₹{f.amount}</strong> on{" "}
                    <strong style={{ color: f.type === "color" ? (f.value === "Green" ? "#22c55e" : f.value === "Violet" ? "#a855f7" : "#ef4444") : "#f59e0b" }}>
                      {f.type === "number" ? `#${f.value}` : f.value}
                    </strong>
                  </span>
                </div>
              ))}
            </div>

            {/* Game History */}
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ ...S.lbl, margin: 0 }}>🎯 Game History</p>
                <button onClick={() => navigate("/wingo-history")} className="viewAllBtn">My Bets →</button>
              </div>
              {history.slice(0,8).map(h => (
                <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>#{h.period}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: getColor(h.result), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>
                      {h.result}
                    </div>
                    <span style={{ color: getColor(h.result), fontSize: 13, fontWeight: 600 }}>{getColorLabel(h.result)} · {h.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === "leaderboard" && (
          <div style={S.card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>🏆 Top WinGo Winners</h3>
            {leaderboard.length === 0 ? <p style={{ color: "#64748b" }}>No data yet</p> : leaderboard.map((e, i) => (
              <div key={e.uid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", marginBottom: 8, background: "rgba(255,255,255,0.04)", borderRadius: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#f97316" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: i < 3 ? "#0f172a" : "#64748b" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                </div>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 }}>
                  {e.name?.[0] || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e2e8f0", fontWeight: 700 }}>{e.name}</div>
                </div>
                <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 17 }}>₹{e.totalWon?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === "stats" && myStats && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { lbl: "Total Wins", val: myStats.wins, icon: "✅", color: "#22c55e" },
                { lbl: "Total Losses", val: myStats.losses, icon: "❌", color: "#ef4444" },
                { lbl: "Win Rate", val: myStats.wins + myStats.losses > 0 ? `${Math.round(myStats.wins/(myStats.wins+myStats.losses)*100)}%` : "0%", icon: "📈", color: "#f59e0b" },
                { lbl: "Total Winnings", val: `₹${(myStats.totalWinnings||0).toLocaleString()}`, icon: "💰", color: "#06b6d4" },
              ].map(s => (
                <div key={s.lbl} style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.val}</div>
                  <div style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/wingo-history")} style={{ display: "block", width: "100%", padding: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
              📜 View Full Bet History →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#1e2348", color: "white", fontFamily: "'Inter','Segoe UI',sans-serif" },
  wrap: { maxWidth: 500, margin: "0 auto", padding: "20px 16px 80px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  balPill: { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e", padding: "7px 14px", borderRadius: 20, fontSize: 14, fontWeight: 700 },
  tabRow: { display: "flex", gap: 8, marginBottom: 16 },
  timerCard: { background: "#2b3270", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18, marginBottom: 12 },
  card: { background: "#2b3270", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, marginBottom: 12 },
  activeBetCard: { background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(43,50,112,1))", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 16, padding: 16, marginBottom: 12 },
  lbl: { color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" },
  infoNote: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 14px", color: "#fbbf24", fontSize: 12.5, marginBottom: 16, lineHeight: 1.5 },
  lockedNote: { textAlign: "center", padding: "10px", color: "#94a3b8", fontSize: 13, background: "rgba(255,255,255,0.03)", borderRadius: 10 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 },
  modal: { background: "#1e2348", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360 },
  modalTitle: { margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: "#f1f5f9" },
  modalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  modalLbl: { color: "#64748b", fontSize: 14 },
  modalVal: { fontSize: 17, fontWeight: 700 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

  @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes bounceIn {
    0% { transform: scale(0.7); opacity: 0; }
    60% { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); }
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shufflePulse { from { transform: scale(1); } to { transform: scale(1.04); } }

  .backBtn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; padding: 8px 14px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; }
  .backBtn:hover { background: rgba(255,255,255,0.1); color: white; }
  .iconBtn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 7px 10px; border-radius: 10px; cursor: pointer; font-size: 16px; }
  .depositBtn { background: linear-gradient(135deg,#22c55e,#16a34a); border: none; color: white; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; }

  .tab { flex: 1; padding: 9px 4px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; }
  .tabActive { flex: 1; padding: 9px 4px; border-radius: 10px; background: rgba(245,158,11,0.18); border: 1px solid rgba(245,158,11,0.45); color: #f59e0b; font-size: 12px; font-weight: 700; cursor: pointer; }

  .qAmt { padding: 7px 12px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .qAmt:hover:not(:disabled) { background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.45); color: #f59e0b; }
  .qAmt:disabled { opacity: 0.35; cursor: not-allowed; }
  .qAmtActive { padding: 7px 12px; border-radius: 8px; background: rgba(245,158,11,0.25); border: 1px solid rgba(245,158,11,0.6); color: #f59e0b; font-size: 13px; font-weight: 800; cursor: pointer; }
  .qAmtActive:disabled { opacity: 0.6; cursor: not-allowed; }
  .amtInput { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: white; font-size: 14px; padding: 7px 10px; outline: none; width: 80px; }
  .amtInput:focus { border-color: rgba(245,158,11,0.5); }
  .amtInput:disabled { opacity: 0.4; cursor: not-allowed; }

  .betBtnGreen { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #16a34a; color: white; box-shadow: 0 4px 14px #16a34a88; }
  .betBtnGreen:hover:not(:disabled) { background: #15803d; transform: translateY(-2px); }
  .betBtnGreen:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .betBtnViolet { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #9333ea; color: white; box-shadow: 0 4px 14px #9333ea88; }
  .betBtnViolet:hover:not(:disabled) { background: #7e22ce; transform: translateY(-2px); }
  .betBtnViolet:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .betBtnRed { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #dc2626; color: white; box-shadow: 0 4px 14px #dc262688; }
  .betBtnRed:hover:not(:disabled) { background: #b91c1c; transform: translateY(-2px); }
  .betBtnRed:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .betBtnBig { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #d97706; color: white; box-shadow: 0 4px 14px #d9770688; }
  .betBtnBig:hover:not(:disabled) { background: #b45309; transform: translateY(-2px); }
  .betBtnBig:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .betBtnSmall { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #0891b2; color: white; box-shadow: 0 4px 14px #0891b288; }
  .betBtnSmall:hover:not(:disabled) { background: #0e7490; transform: translateY(-2px); }
  .betBtnSmall:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .numBtn:hover:not(:disabled) { transform: scale(1.1); }

  .autoBetOn { padding: 6px 14px; border-radius: 8px; background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.5); color: #22c55e; font-size: 13px; font-weight: 700; cursor: pointer; }
  .autoBetOff { padding: 6px 14px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; }

  .viewAllBtn { background: transparent; border: none; color: #f59e0b; font-size: 12px; font-weight: 700; cursor: pointer; }
  .modalCancel { flex: 1; padding: 13px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer; }
  .modalConfirm { flex: 1; padding: 13px; border-radius: 10px; background: linear-gradient(135deg,#22c55e,#16a34a); border: none; color: white; font-size: 14px; font-weight: 700; cursor: pointer; }
  .modalConfirm:disabled { opacity: 0.6; cursor: not-allowed; }

  .cancelBetBtn { width: 100%; padding: 12px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #ef4444; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
  .cancelBetBtn:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
  .cancelBetBtn:disabled { opacity: 0.6; cursor: not-allowed; }

  .btnSpinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
`;

// import { useState, useEffect, useRef } from "react";
// import { auth, db } from "../firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import {
//   doc, getDoc, updateDoc, addDoc, deleteDoc, collection,
//   query, orderBy, limit, onSnapshot, where,
// } from "firebase/firestore";

// function getColor(num) {
//   if ([0, 5].includes(num)) return "#a855f7";
//   if ([1, 3, 7, 9].includes(num)) return "#22c55e";
//   return "#ef4444";
// }
// function getColorLabel(num) {
//   if ([0, 5].includes(num)) return "Violet";
//   if ([1, 3, 7, 9].includes(num)) return "Green";
//   return "Red";
// }

// // ── Sound ─────────────────────────────────────────────────────────────
// function playSound(type) {
//   try {
//     const ctx = new (window.AudioContext || window.webkitAudioContext)();
//     const o = ctx.createOscillator();
//     const g = ctx.createGain();
//     o.connect(g); g.connect(ctx.destination);
//     if (type === "win") {
//       o.frequency.setValueAtTime(523, ctx.currentTime);
//       o.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
//       o.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
//       o.frequency.setValueAtTime(1047, ctx.currentTime + 0.3);
//       g.gain.setValueAtTime(0.3, ctx.currentTime);
//       g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
//       o.start(); o.stop(ctx.currentTime + 0.6);
//     } else if (type === "lose") {
//       o.frequency.setValueAtTime(300, ctx.currentTime);
//       o.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
//       g.gain.setValueAtTime(0.2, ctx.currentTime);
//       g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
//       o.start(); o.stop(ctx.currentTime + 0.4);
//     } else if (type === "bet") {
//       o.frequency.setValueAtTime(440, ctx.currentTime);
//       g.gain.setValueAtTime(0.15, ctx.currentTime);
//       g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
//       o.start(); o.stop(ctx.currentTime + 0.15);
//     } else if (type === "tick") {
//       o.frequency.setValueAtTime(880, ctx.currentTime);
//       o.type = "square";
//       g.gain.setValueAtTime(0.08, ctx.currentTime);
//       g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
//       o.start(); o.stop(ctx.currentTime + 0.08);
//     } else if (type === "cancel") {
//       o.frequency.setValueAtTime(350, ctx.currentTime);
//       o.frequency.setValueAtTime(250, ctx.currentTime + 0.1);
//       g.gain.setValueAtTime(0.15, ctx.currentTime);
//       g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
//       o.start(); o.stop(ctx.currentTime + 0.25);
//     } else if (type === "shuffle") {
//       o.frequency.setValueAtTime(300 + Math.random() * 500, ctx.currentTime);
//       o.type = "square";
//       g.gain.setValueAtTime(0.04, ctx.currentTime);
//       g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
//       o.start(); o.stop(ctx.currentTime + 0.07);
//     }
//   } catch (e) {}
// }

// // ── Win/Loss Popup (same style as bet modal) ──────────────────────────
// function WinLossPopup({ show, bet, result, onClose }) {
//   if (!show || !bet) return null;
//   const won = bet.status === "won";
//   return (
//     <div style={{
//       position: "fixed", inset: 0,
//       background: "rgba(0,0,0,0.80)",
//       display: "flex", alignItems: "center", justifyContent: "center",
//       zIndex: 99999, padding: 20,
//       animation: "fadeInBg 0.25s ease",
//     }} onClick={onClose}>
//       <div style={{
//         background: won
//           ? "linear-gradient(160deg, #0f2d1a, #1e2348)"
//           : "linear-gradient(160deg, #2d0f0f, #1e2348)",
//         border: `2px solid ${won ? "#22c55e" : "#ef4444"}`,
//         borderRadius: 24, padding: "32px 28px",
//         width: "100%", maxWidth: 340,
//         textAlign: "center",
//         animation: "popupIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
//         boxShadow: `0 0 60px ${won ? "#22c55e44" : "#ef444444"}`,
//       }} onClick={e => e.stopPropagation()}>

//         {/* Big emoji */}
//         <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>
//           {won ? "🎉" : "😢"}
//         </div>

//         {/* Win / Lose title */}
//         <div style={{
//           fontSize: 28, fontWeight: 900,
//           color: won ? "#22c55e" : "#ef4444",
//           marginBottom: 8,
//         }}>
//           {won ? "You Won!" : "You Lost!"}
//         </div>

//         {/* Amount */}
//         <div style={{
//           fontSize: 42, fontWeight: 900,
//           color: won ? "#22c55e" : "#ef4444",
//           marginBottom: 20,
//         }}>
//           {won ? `+₹${bet.payout}` : `-₹${bet.amount}`}
//         </div>

//         {/* Details rows — same as bet modal */}
//         <div style={popupRowStyle}>
//           <span style={popupLblStyle}>Your Bet</span>
//           <span style={{ ...popupValStyle, color: "white" }}>
//             {bet.type === "number" ? `Number ${bet.value}` : bet.value}
//           </span>
//         </div>
//         <div style={popupRowStyle}>
//           <span style={popupLblStyle}>Bet Amount</span>
//           <span style={{ ...popupValStyle, color: "#f1f5f9" }}>₹{bet.amount}</span>
//         </div>
//         {result !== undefined && (
//           <div style={popupRowStyle}>
//             <span style={popupLblStyle}>Round Result</span>
//             <span style={{ ...popupValStyle, color: getColor(result), fontWeight: 800 }}>
//               {result} ({getColorLabel(result)})
//             </span>
//           </div>
//         )}
//         {won && (
//           <div style={{ ...popupRowStyle, borderBottom: "none" }}>
//             <span style={popupLblStyle}>Payout</span>
//             <span style={{ ...popupValStyle, color: "#22c55e", fontSize: 22, fontWeight: 900 }}>
//               ₹{bet.payout}
//             </span>
//           </div>
//         )}

//         {/* Close button */}
//         <button onClick={onClose} style={{
//           marginTop: 22, width: "100%", padding: "14px",
//           background: won
//             ? "linear-gradient(135deg,#22c55e,#16a34a)"
//             : "linear-gradient(135deg,#ef4444,#b91c1c)",
//           border: "none", borderRadius: 12, color: "white",
//           fontSize: 16, fontWeight: 700, cursor: "pointer",
//         }}>
//           {won ? "🎊 Awesome!" : "😤 Try Again"}
//         </button>
//       </div>
//     </div>
//   );
// }

// const popupRowStyle = {
//   display: "flex", justifyContent: "space-between", alignItems: "center",
//   padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
// };
// const popupLblStyle = { color: "#64748b", fontSize: 14 };
// const popupValStyle = { fontSize: 16, fontWeight: 700 };

// // ── Shuffle Number Display (in timer card) ────────────────────────────
// function ShuffleDisplay({ isShuffling, shuffleNum }) {
//   if (!isShuffling) return null;
//   const col = "#f59e0b";
//   return (
//     <div style={{
//       display: "flex", flexDirection: "column", alignItems: "center",
//       padding: "16px 0 4px",
//       borderTop: "1px solid rgba(255,255,255,0.08)",
//       marginTop: 14,
//     }}>
//       <p style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>
//         🎲 Rolling result...
//       </p>
//       <div style={{
//         width: 80, height: 80, borderRadius: "50%",
//         background: col,
//         display: "flex", alignItems: "center", justifyContent: "center",
//         fontSize: 38, fontWeight: 900, color: "white",
//         boxShadow: `0 0 32px ${col}88`,
//         animation: "shuffleBounce 0.15s ease infinite alternate",
//       }}>
//         {shuffleNum}
//       </div>
//     </div>
//   );
// }

// export default function WinGo() {
//   const navigate = useNavigate();

//   const [user, setUser] = useState(null);
//   const [balance, setBalance] = useState(0);
//   const [userName, setUserName] = useState("");

//   const [gameState, setGameState] = useState(null);
//   const [timeLeft, setTimeLeft] = useState(30);
//   const [phase, setPhase] = useState("betting");

//   const [betAmount, setBetAmount] = useState(50);
//   const [showModal, setShowModal] = useState(false);
//   const [pendingBet, setPendingBet] = useState(null);
//   const [betLoading, setBetLoading] = useState(false);
//   const [cancelLoading, setCancelLoading] = useState(false);

//   const [autoBet, setAutoBet] = useState(false);
//   const [autoBetCount, setAutoBetCount] = useState(3);
//   const [selectedBet, setSelectedBet] = useState(null);
//   const autoBetRef = useRef(false);

//   const [soundOn, setSoundOn] = useState(true);
//   const soundRef = useRef(true);
//   useEffect(() => { soundRef.current = soundOn; }, [soundOn]);

//   // ── History — frozen during shuffle so result doesn't appear early ──
//   const [history, setHistory] = useState([]);
//   const [frozenHistory, setFrozenHistory] = useState(null); // null = use live

//   const [myBets, setMyBets] = useState([]);
//   const [liveFeed, setLiveFeed] = useState([]);
//   const [leaderboard, setLeaderboard] = useState([]);
//   const [myStats, setMyStats] = useState(null);
//   const [tab, setTab] = useState("game");

//   // ── Shuffle state ─────────────────────────────────────────────────
//   const [isShuffling, setIsShuffling] = useState(false);
//   const [shuffleNum, setShuffleNum] = useState(0);
//   const shuffleIntervalRef = useRef(null);
//   const shuffleStartedForPeriod = useRef(null); // prevent double-trigger

//   // ── Win/Loss popup ────────────────────────────────────────────────
//   const [showWinLoss, setShowWinLoss] = useState(false);
//   const [winLossBet, setWinLossBet] = useState(null);
//   const winLossShownForPeriod = useRef(null);

//   // ── Optimistic bet ────────────────────────────────────────────────
//   const [optimisticBet, setOptimisticBet] = useState(null);
//   const firestoreDocIdRef = useRef(null);

//   const [toasts, setToasts] = useState([]);
//   const addToast = (msg, type = "info") => {
//     const id = Date.now() + Math.random();
//     setToasts(t => [...t, { id, msg, type }]);
//     setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
//   };

//   const quickAmounts = [10, 20, 50, 100, 200, 500];

//   // ── Auth ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (u) => {
//       if (!u) { navigate("/"); return; }
//       setUser(u);
//     });
//     return () => unsub();
//   }, [navigate]);

//   // ── User stats live ───────────────────────────────────────────────
//   useEffect(() => {
//     if (!user) return;
//     const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
//       if (snap.exists()) {
//         const d = snap.data();
//         setBalance(d.balance || 0);
//         setUserName(d.name || "");
//         setMyStats({ wins: d.wingoWins || 0, losses: d.wingoLosses || 0, totalWinnings: d.totalWinnings || 0 });
//       }
//     });
//     return () => unsub();
//   }, [user]);

//   // ── Game state ────────────────────────────────────────────────────
//   useEffect(() => {
//     const unsub = onSnapshot(doc(db, "gameState", "current"), (snap) => {
//       if (!snap.exists()) return;
//       const g = snap.data();
//       setGameState(g);
//       setPhase(g.phase || "betting");
//       if (g.phase === "betting") {
//         const elapsed = Math.floor((Date.now() - g.startTime) / 1000);
//         setTimeLeft(Math.max(30 - elapsed, 0));
//       } else {
//         setTimeLeft(0);
//       }
//     });
//     return () => unsub();
//   }, []);

//   // ── Timer countdown + SHUFFLE TRIGGER at 5s left ──────────────────
//   const prevSecsRef = useRef(99);
//   const shuffleTriggeredRef = useRef(false); // so we only trigger once per round

//   useEffect(() => {
//     if (!gameState) return;

//     // New round started → reset shuffle trigger
//     if (gameState.phase === "betting") {
//       shuffleTriggeredRef.current = false;
//     }

//     const timer = setInterval(() => {
//       if (gameState.phase === "betting") {
//         const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
//         const remaining = Math.max(30 - elapsed, 0);
//         setTimeLeft(remaining);

//         // Tick sound
//         if (remaining <= 5 && remaining > 0 && remaining !== prevSecsRef.current && soundRef.current) {
//           playSound("tick");
//         }
//         prevSecsRef.current = remaining;

//         // ── START SHUFFLE when 5 seconds left ────────────────────────
//         if (remaining <= 5 && remaining > 0 && !shuffleTriggeredRef.current) {
//           shuffleTriggeredRef.current = true;
//           startShuffle();
//         }

//       } else {
//         setTimeLeft(0);
//       }
//     }, 500);
//     return () => clearInterval(timer);
//   }, [gameState]);

//   // ── Start shuffle: freeze history, start flipping numbers ─────────
//   const startShuffle = () => {
//     // Freeze recent results so new result doesn't appear during shuffle
//     setFrozenHistory(prev => prev); // will be set below with latest history
//     setFrozenHistory(h => h);       // placeholder — real freeze in next line
//     setIsShuffling(true);

//     // Clear any old interval
//     if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);

//     let speed = 80;
//     let count = 0;
//     // Animate with increasing delays
//     const animate = () => {
//       setShuffleNum(Math.floor(Math.random() * 10));
//       if (soundRef.current) playSound("shuffle");
//       count++;
//       // Shuffle for ~4 seconds then wait for backend result phase
//       if (count < 50) {
//         if (count > 35) speed = 180;
//         else if (count > 25) speed = 120;
//         shuffleIntervalRef.current = setTimeout(animate, speed);
//       }
//       // After 50 ticks just keep slowly going until result phase sets the real number
//       else {
//         shuffleIntervalRef.current = setTimeout(() => {
//           setShuffleNum(Math.floor(Math.random() * 10));
//         }, 400);
//       }
//     };
//     shuffleIntervalRef.current = setTimeout(animate, speed);
//   };

//   // Freeze history when shuffle starts
//   useEffect(() => {
//     if (isShuffling && frozenHistory === null) {
//       setFrozenHistory([...history]);
//     }
//   }, [isShuffling]);

//   // ── When result phase comes: show final number then stop shuffle ───
//   const prevPhaseRef = useRef("betting");

//   useEffect(() => {
//     if (!gameState) return;

//     // Result phase just started
//     if (gameState.phase === "result" && prevPhaseRef.current === "betting") {
//       if (gameState.result !== undefined && gameState.result !== null) {
//         // Show final result number
//         setShuffleNum(gameState.result);
//         // Stop shuffle animation after short delay (let user see final number)
//         setTimeout(() => {
//           setIsShuffling(false);
//           clearInterval(shuffleIntervalRef.current);
//         }, 1200);
//       }
//     }

//     // New betting round started
//     if (gameState.phase === "betting" && prevPhaseRef.current === "result") {
//       setIsShuffling(false);
//       setFrozenHistory(null); // unfreeze history
//       clearInterval(shuffleIntervalRef.current);
//     }

//     prevPhaseRef.current = gameState.phase;
//   }, [gameState?.phase, gameState?.period]);

//   // ── Show win/loss popup after shuffle ends + bet settled ──────────
//   const myBetsRef = useRef([]);
//   useEffect(() => { myBetsRef.current = myBets; }, [myBets]);

//   useEffect(() => {
//     if (!gameState || !user) return;
//     if (gameState.phase !== "result") return;

//     // Show popup once per period
//     if (winLossShownForPeriod.current === gameState.period) return;

//     // Wait a bit for shuffle to finish + Firestore to settle the bet
//     const checkAndShow = () => {
//       const settled = myBetsRef.current.find(
//         b => b.period === gameState.period && (b.status === "won" || b.status === "lost")
//       );
//       if (settled) {
//         winLossShownForPeriod.current = gameState.period;
//         setWinLossBet(settled);
//         setShowWinLoss(true);
//         if (settled.status === "won") {
//           if (soundRef.current) playSound("win");
//         } else {
//           if (soundRef.current) playSound("lose");
//         }
//       }
//     };

//     // Check at 1.5s (shuffle still going), 2.5s, 4s — whichever finds settled bet first
//     const t1 = setTimeout(checkAndShow, 1500);
//     const t2 = setTimeout(checkAndShow, 2500);
//     const t3 = setTimeout(checkAndShow, 4000);

//     return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
//   }, [gameState?.phase, gameState?.period]);

//   // Also check when myBets updates (in case Firestore is slow)
//   useEffect(() => {
//     if (!gameState || !user) return;
//     if (gameState.phase !== "result") return;
//     if (winLossShownForPeriod.current === gameState.period) return;

//     const settled = myBets.find(
//       b => b.period === gameState.period && (b.status === "won" || b.status === "lost")
//     );
//     if (settled) {
//       winLossShownForPeriod.current = gameState.period;
//       setWinLossBet(settled);
//       setShowWinLoss(true);
//       if (settled.status === "won") {
//         if (soundRef.current) playSound("win");
//       } else {
//         if (soundRef.current) playSound("lose");
//       }
//     }
//   }, [myBets]);

//   // Reset win/loss popup when new round starts
//   useEffect(() => {
//     if (!gameState) return;
//     if (gameState.phase === "betting") {
//       // Don't auto-close — let user close it manually
//       // But hide it when new round's betting starts if they missed closing
//     }
//   }, [gameState?.period]);

//   // ── Clear optimistic bet ──────────────────────────────────────────
//   useEffect(() => {
//     if (!optimisticBet || !gameState) return;
//     const confirmed = myBets.find(b => b.period === gameState.period && b.status === "pending");
//     if (confirmed) setOptimisticBet(null);
//   }, [myBets, optimisticBet, gameState]);

//   useEffect(() => {
//     if (!gameState) return;
//     if (optimisticBet && optimisticBet.period !== gameState.period) setOptimisticBet(null);
//   }, [gameState?.period]);

//   // ── History listener ──────────────────────────────────────────────
//   useEffect(() => {
//     const q = query(collection(db, "wingoHistory"), orderBy("createdAt", "desc"), limit(20));
//     const unsub = onSnapshot(q, snap => {
//       const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
//       setHistory(data);
//       // If not shuffling, update frozen too (keep in sync for when we freeze)
//       if (!isShuffling) setFrozenHistory(null);
//     });
//     return () => unsub();
//   }, []);

//   // ── My bets ───────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!user) return;
//     const q = query(collection(db, "userBets"), where("uid", "==", user.uid), orderBy("createdAt", "desc"), limit(20));
//     const unsub = onSnapshot(q, snap => setMyBets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
//     return () => unsub();
//   }, [user]);

//   // ── Live feed ─────────────────────────────────────────────────────
//   useEffect(() => {
//     const q = query(collection(db, "userBets"), orderBy("createdAt", "desc"), limit(8));
//     const unsub = onSnapshot(q, snap => setLiveFeed(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
//     return () => unsub();
//   }, []);

//   // ── Leaderboard ───────────────────────────────────────────────────
//   useEffect(() => {
//     const unsub = onSnapshot(doc(db, "leaderboard", "wingo"), snap => {
//       if (snap.exists()) setLeaderboard(snap.data().top10 || []);
//     });
//     return () => unsub();
//   }, []);

//   // ── Derived ───────────────────────────────────────────────────────
//   const firestoreBet = myBets.find(b => b.period === gameState?.period && b.status === "pending");
//   const currentBet = optimisticBet ?? firestoreBet;
//   const hasActiveBet = !!currentBet;
//   const canCancelBet = currentBet && phase === "betting" && timeLeft > 5;

//   // Use frozen history during shuffle to prevent early result showing
//   const displayHistory = (isShuffling && frozenHistory !== null) ? frozenHistory : history;

//   // ── Auto-bet ──────────────────────────────────────────────────────
//   useEffect(() => { autoBetRef.current = autoBet; }, [autoBet]);
//   const prevPeriodRef = useRef(null);
//   useEffect(() => {
//     if (!gameState || !user) return;
//     if (gameState.phase === "betting" && gameState.period !== prevPeriodRef.current) {
//       prevPeriodRef.current = gameState.period;
//       if (autoBetRef.current && selectedBet && autoBetCount > 0) {
//         setTimeout(() => {
//           placeBetDirect(selectedBet);
//           setAutoBetCount(c => {
//             const newC = c - 1;
//             if (newC <= 0) setAutoBet(false);
//             return newC;
//           });
//         }, 1500);
//       }
//     }
//   }, [gameState?.period]);

//   // ── Open modal ────────────────────────────────────────────────────
//   const openBetModal = (type, value) => {
//     if (bettingLocked) { addToast("⏳ Bets are locked!", "info"); return; }
//     if (hasActiveBet) { addToast("⚠️ You already have an active bet this round!", "info"); return; }
//     setPendingBet({ type, value });
//     setSelectedBet({ type, value });
//     setShowModal(true);
//   };

//   // ── Place bet ─────────────────────────────────────────────────────
//   const placeBetDirect = async (bet) => {
//     if (!user || !gameState) return;
//     const existingFirestore = myBets.find(b => b.period === gameState.period && b.status === "pending");
//     if (existingFirestore || optimisticBet) { addToast("⚠️ You already have an active bet!", "info"); return; }
//     if (betAmount > balance) { addToast("❌ Insufficient balance!", "lose"); return; }
//     if (betAmount < 10) { addToast("❌ Minimum bet ₹10", "lose"); return; }
//     if (betAmount > 8000) { addToast("❌ Maximum bet ₹8000", "lose"); return; }

//     const optimistic = {
//       id: "__optimistic__", uid: user.uid, userName,
//       period: gameState.period, type: bet.type, value: bet.value,
//       amount: betAmount, status: "pending", optimistic: true, createdAt: new Date(),
//     };
//     setOptimisticBet(optimistic);
//     setBalance(prev => prev - betAmount);
//     setBetLoading(true);

//     try {
//       const freshSnap = await getDoc(doc(db, "users", user.uid));
//       const freshBalance = freshSnap.exists() ? (freshSnap.data().balance || 0) : balance;
//       if (betAmount > freshBalance) {
//         setOptimisticBet(null); setBalance(freshBalance);
//         addToast("❌ Insufficient balance!", "lose"); setBetLoading(false); return;
//       }
//       await updateDoc(doc(db, "users", user.uid), { balance: freshBalance - betAmount });
//       const betDocRef = await addDoc(collection(db, "userBets"), {
//         uid: user.uid, userName, period: gameState.period,
//         type: bet.type, value: bet.value, amount: betAmount,
//         status: "pending", createdAt: new Date(),
//       });
//       firestoreDocIdRef.current = betDocRef.id;
//       if (soundRef.current) playSound("bet");
//       addToast(`✅ Bet placed: ${bet.type === "number" ? `#${bet.value}` : bet.value} — ₹${betAmount}`, "info");
//     } catch (e) {
//       setOptimisticBet(null);
//       firestoreDocIdRef.current = null;
//       setBalance(prev => prev + betAmount);
//       addToast("❌ Error placing bet. Try again.", "lose");
//     } finally {
//       setBetLoading(false);
//     }
//   };

//   const confirmBet = async () => {
//     if (!pendingBet) return;
//     await placeBetDirect(pendingBet);
//     setShowModal(false);
//   };

//   // ── Cancel bet ────────────────────────────────────────────────────
//   const cancelBet = async () => {
//     if (!currentBet || !user) return;
//     if (phase !== "betting" || timeLeft <= 5) { addToast("⏳ Too late to cancel!", "lose"); return; }
//     const betToCancel = currentBet;
//     const docIdToDelete = betToCancel.optimistic ? firestoreDocIdRef.current : betToCancel.id;
//     setOptimisticBet(null);
//     firestoreDocIdRef.current = null;
//     setBalance(prev => prev + betToCancel.amount);
//     setCancelLoading(true);
//     try {
//       const freshSnap = await getDoc(doc(db, "users", user.uid));
//       const freshBalance = freshSnap.exists() ? (freshSnap.data().balance || 0) : balance;
//       await updateDoc(doc(db, "users", user.uid), { balance: freshBalance + betToCancel.amount });
//       if (docIdToDelete) await deleteDoc(doc(db, "userBets", docIdToDelete));
//       if (soundRef.current) playSound("cancel");
//       addToast(`↩️ Bet cancelled — ₹${betToCancel.amount} refunded`, "info");
//       setSelectedBet(null);
//     } catch (e) {
//       setOptimisticBet(betToCancel);
//       setBalance(prev => prev - betToCancel.amount);
//       addToast("❌ Error cancelling. Try again.", "lose");
//     } finally {
//       setCancelLoading(false);
//     }
//   };

//   const bettingLocked = phase !== "betting" || timeLeft <= 5;
//   const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
//   const secs = String(timeLeft % 60).padStart(2, "0");

//   const getMultiplier = (type, value) => {
//     if (type === "number") return "9x";
//     if (type === "color" && value === "Violet") return "4.5x";
//     return "2x";
//   };
//   const getPotential = (type, value) => {
//     if (type === "number") return betAmount * 9;
//     if (type === "color" && value === "Violet") return Math.floor(betAmount * 4.5);
//     return betAmount * 2;
//   };

//   // Toast UI
//   const ToastUI = () => (
//     <div style={{ position: "fixed", top: 20, right: 20, zIndex: 99998, display: "flex", flexDirection: "column", gap: 10 }}>
//       {toasts.map(t => (
//         <div key={t.id} style={{
//           background: t.type === "win" ? "linear-gradient(135deg,#14532d,#166534)" : t.type === "lose" ? "linear-gradient(135deg,#7f1d1d,#991b1b)" : "linear-gradient(135deg,#1e3a5f,#1e40af)",
//           border: `1px solid ${t.type === "win" ? "#22c55e" : t.type === "lose" ? "#ef4444" : "#3b82f6"}`,
//           borderRadius: 14, padding: "14px 20px", color: "white",
//           fontSize: 15, fontWeight: 700, minWidth: 220,
//           boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
//           animation: "slideIn 0.3s ease",
//         }}>
//           {t.msg}
//         </div>
//       ))}
//     </div>
//   );

//   return (
//     <div style={S.page}>
//       <style>{css}</style>
//       <ToastUI />

//       {/* ── Win/Loss Popup ── */}
//       <WinLossPopup
//         show={showWinLoss}
//         bet={winLossBet}
//         result={gameState?.result}
//         onClose={() => setShowWinLoss(false)}
//       />

//       {/* ── Bet Confirm Modal ── */}
//       {showModal && pendingBet && (
//         <div style={S.overlay} onClick={() => setShowModal(false)}>
//           <div style={S.modal} onClick={e => e.stopPropagation()}>
//             <h3 style={S.modalTitle}>Confirm Bet</h3>
//             <div style={S.modalRow}>
//               <span style={S.modalLbl}>Betting on</span>
//               <span style={{ ...S.modalVal, color: pendingBet.type === "color" ? (pendingBet.value === "Green" ? "#22c55e" : pendingBet.value === "Violet" ? "#a855f7" : "#ef4444") : "#f59e0b", fontSize: 20 }}>
//                 {pendingBet.type === "number" ? `Number ${pendingBet.value}` : pendingBet.value}
//               </span>
//             </div>
//             <div style={S.modalRow}>
//               <span style={S.modalLbl}>Amount</span>
//               <span style={{ ...S.modalVal, color: "#f1f5f9" }}>₹{betAmount}</span>
//             </div>
//             <div style={S.modalRow}>
//               <span style={S.modalLbl}>Multiplier</span>
//               <span style={{ ...S.modalVal, color: "#f59e0b" }}>{getMultiplier(pendingBet.type, pendingBet.value)}</span>
//             </div>
//             <div style={{ ...S.modalRow, borderBottom: "none" }}>
//               <span style={S.modalLbl}>Potential Win</span>
//               <span style={{ ...S.modalVal, color: "#22c55e", fontSize: 22, fontWeight: 800 }}>₹{getPotential(pendingBet.type, pendingBet.value)}</span>
//             </div>
//             <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
//               <button onClick={() => setShowModal(false)} className="modalCancel">Cancel</button>
//               <button onClick={confirmBet} disabled={betLoading} className="modalConfirm">
//                 {betLoading ? <span className="btnSpinner"></span> : "✅ Confirm Bet"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div style={S.wrap}>

//         {/* Header */}
//         <div style={S.header}>
//           <button onClick={() => navigate("/dashboard")} className="backBtn">← Back</button>
//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <button onClick={() => setSoundOn(!soundOn)} className="iconBtn">{soundOn ? "🔊" : "🔇"}</button>
//             <div style={S.balPill}>💰 ₹{balance.toLocaleString()}</div>
//             <button onClick={() => navigate("/deposit")} className="depositBtn">+ Deposit</button>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div style={S.tabRow}>
//           {[["game","🎯 Game"],["leaderboard","🏆 Top"],["stats","📊 Stats"]].map(([k,lbl]) => (
//             <button key={k} onClick={() => setTab(k)} className={tab === k ? "tabActive" : "tab"}>{lbl}</button>
//           ))}
//         </div>

//         {tab === "game" && (
//           <>
//             {/* ── Timer Card ── */}
//             <div style={S.timerCard}>
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//                 <div>
//                   <p style={S.lbl}>Period</p>
//                   <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>#{gameState?.period || "—"}</p>
//                 </div>
//                 <div style={{ textAlign: "right" }}>
//                   <p style={{ ...S.lbl, color: isShuffling ? "#a855f7" : bettingLocked ? "#ef4444" : "#22c55e" }}>
//                     {isShuffling ? "🎲 Drawing..." : bettingLocked ? "🔒 Bets Locked" : "✅ Bets Open"}
//                   </p>
//                   <div style={{
//                     fontSize: 40, fontWeight: 800, fontFamily: "monospace",
//                     color: isShuffling ? "#a855f7" : timeLeft <= 5 ? "#ef4444" : "#f59e0b",
//                     letterSpacing: 2,
//                   }}>
//                     {`${mins}:${secs}`}
//                   </div>
//                 </div>
//               </div>

//               {/* Shuffle animation — visible during last 5s + result phase */}
//               <ShuffleDisplay isShuffling={isShuffling} shuffleNum={shuffleNum} />

//               {/* Static final result — shown after shuffle ends during result phase */}
//               {!isShuffling && phase === "result" && gameState?.result !== undefined && (
//                 <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap", animation: "fadeIn 0.5s ease" }}>
//                   <span style={{ color: "#64748b", fontSize: 13 }}>Round Result:</span>
//                   <div style={{
//                     width: 44, height: 44, borderRadius: "50%",
//                     background: getColor(gameState.result),
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                     fontWeight: 900, fontSize: 20, color: "white",
//                     boxShadow: `0 0 24px ${getColor(gameState.result)}99`,
//                   }}>
//                     {gameState.result}
//                   </div>
//                   <span style={{ color: getColor(gameState.result), fontWeight: 700, fontSize: 16 }}>
//                     {getColorLabel(gameState.result)} · {gameState.resultSize}
//                   </span>
//                 </div>
//               )}
//             </div>

//             {/* Recent Results — frozen during shuffle */}
//             <div style={S.card}>
//               <p style={S.lbl}>Recent Results</p>
//               <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
//                 {displayHistory.slice(0, 14).map(h => (
//                   <div key={h.id} style={{
//                     width: 34, height: 34, borderRadius: "50%",
//                     background: getColor(h.result),
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                     fontWeight: 800, fontSize: 14, color: "white",
//                     boxShadow: `0 2px 8px ${getColor(h.result)}66`,
//                   }}>
//                     {h.result}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Active Bet Card */}
//             {hasActiveBet && (
//               <div style={S.activeBetCard}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                   <p style={{ ...S.lbl, margin: 0, color: "#f59e0b" }}>
//                     🎯 Your Active Bet — Round #{currentBet.period}
//                   </p>
//                   {canCancelBet
//                     ? <span style={{ fontSize: 11, color: "#64748b" }}>Cancel window: {Math.max(timeLeft - 5, 0)}s left</span>
//                     : <span style={{ fontSize: 11, color: "#ef4444" }}>🔒 Locked</span>
//                   }
//                 </div>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
//                   <div>
//                     <div style={{
//                       fontSize: 18, fontWeight: 800,
//                       color: currentBet.type === "color"
//                         ? (currentBet.value === "Green" ? "#22c55e" : currentBet.value === "Violet" ? "#a855f7" : "#ef4444")
//                         : "#f59e0b",
//                     }}>
//                       {currentBet.type === "number" ? `Number ${currentBet.value}` : currentBet.value}
//                     </div>
//                     <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
//                       {getMultiplier(currentBet.type, currentBet.value)} multiplier
//                     </div>
//                   </div>
//                   <div style={{ textAlign: "right" }}>
//                     <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>₹{currentBet.amount}</div>
//                     <div style={{ color: "#22c55e", fontSize: 12, marginTop: 2 }}>
//                       Win: ₹{currentBet.type === "number" ? currentBet.amount * 9 : currentBet.value === "Violet" ? Math.floor(currentBet.amount * 4.5) : currentBet.amount * 2}
//                     </div>
//                   </div>
//                 </div>
//                 {canCancelBet ? (
//                   <button onClick={cancelBet} disabled={cancelLoading} className="cancelBetBtn">
//                     {cancelLoading ? <span className="btnSpinner"></span> : "❌ Cancel Bet & Refund"}
//                   </button>
//                 ) : (
//                   <div style={S.lockedNote}>⏳ Cancellation closed — bet is locked for this round</div>
//                 )}
//               </div>
//             )}

//             {/* Betting Card */}
//             <div style={S.card}>
//               <p style={S.lbl}>Quick Bet Amount</p>
//               <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
//                 {quickAmounts.map(q => (
//                   <button key={q} disabled={hasActiveBet} onClick={() => setBetAmount(q)} className={betAmount === q ? "qAmtActive" : "qAmt"}>₹{q}</button>
//                 ))}
//               </div>
//               <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
//                 <span style={{ color: "#64748b", fontSize: 13 }}>Custom:</span>
//                 <input type="number" value={betAmount} min={10} max={8000} disabled={hasActiveBet}
//                   onChange={e => setBetAmount(Number(e.target.value))} className="amtInput" />
//               </div>

//               {hasActiveBet && (
//                 <div style={S.infoNote}>ℹ️ One bet per round. Wait for round to finish or cancel your bet.</div>
//               )}

//               <p style={S.lbl}>Color</p>
//               <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
//                 <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("color","Green")} className="betBtnGreen">🟢 Green <span style={{ fontSize: 11, opacity: 0.85 }}>2x</span></button>
//                 <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("color","Violet")} className="betBtnViolet">🟣 Violet <span style={{ fontSize: 11, opacity: 0.85 }}>4.5x</span></button>
//                 <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("color","Red")} className="betBtnRed">🔴 Red <span style={{ fontSize: 11, opacity: 0.85 }}>2x</span></button>
//               </div>

//               <p style={S.lbl}>Number (9x)</p>
//               <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 18 }}>
//                 {[0,1,2,3,4,5,6,7,8,9].map(n => (
//                   <button key={n} disabled={bettingLocked || hasActiveBet}
//                     onClick={() => openBetModal("number", n)}
//                     style={{
//                       padding: "14px 0", borderRadius: 12, border: "none",
//                       fontSize: 18, fontWeight: 800,
//                       cursor: (bettingLocked || hasActiveBet) ? "not-allowed" : "pointer",
//                       opacity: (bettingLocked || hasActiveBet) ? 0.45 : 1,
//                       color: "white",
//                       background: [0,5].includes(n) ? "#9333ea" : [1,3,7,9].includes(n) ? "#16a34a" : "#dc2626",
//                       boxShadow: (bettingLocked || hasActiveBet) ? "none" : `0 4px 12px ${[0,5].includes(n) ? "#9333ea88" : [1,3,7,9].includes(n) ? "#16a34a88" : "#dc262688"}`,
//                       transition: "all 0.15s",
//                     }}
//                     className="numBtn"
//                   >{n}</button>
//                 ))}
//               </div>

//               <p style={S.lbl}>Size (2x)</p>
//               <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
//                 <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("size","Big")} className="betBtnBig">🔼 Big</button>
//                 <button disabled={bettingLocked || hasActiveBet} onClick={() => openBetModal("size","Small")} className="betBtnSmall">🔽 Small</button>
//               </div>

//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                   <span style={{ color: "#94a3b8", fontSize: 13 }}>Auto-Bet</span>
//                   <button onClick={() => { if (!selectedBet) { addToast("Select a bet type first", "info"); return; } setAutoBet(!autoBet); }} className={autoBet ? "autoBetOn" : "autoBetOff"}>
//                     {autoBet ? "ON 🟢" : "OFF ⚫"}
//                   </button>
//                 </div>
//                 {autoBet && (
//                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                     <span style={{ color: "#64748b", fontSize: 12 }}>Rounds:</span>
//                     <input type="number" value={autoBetCount} min={1} max={50}
//                       onChange={e => setAutoBetCount(Number(e.target.value))} className="amtInput" style={{ width: 60 }} />
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Live Feed */}
//             <div style={S.card}>
//               <p style={S.lbl}>⚡ Live Activity</p>
//               {liveFeed.slice(0,6).map(f => (
//                 <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
//                   <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>
//                     {f.userName?.[0] || "?"}
//                   </div>
//                   <span style={{ fontSize: 13, color: "#94a3b8" }}>
//                     <strong style={{ color: "#e2e8f0" }}>{f.userName || "Player"}</strong> bet{" "}
//                     <strong style={{ color: "#f59e0b" }}>₹{f.amount}</strong> on{" "}
//                     <strong style={{ color: f.type === "color" ? (f.value === "Green" ? "#22c55e" : f.value === "Violet" ? "#a855f7" : "#ef4444") : "#f59e0b" }}>
//                       {f.type === "number" ? `#${f.value}` : f.value}
//                     </strong>
//                   </span>
//                 </div>
//               ))}
//             </div>

//             {/* Game History */}
//             <div style={S.card}>
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
//                 <p style={{ ...S.lbl, margin: 0 }}>🎯 Game History</p>
//                 <button onClick={() => navigate("/wingo-history")} className="viewAllBtn">My Bets →</button>
//               </div>
//               {displayHistory.slice(0,8).map(h => (
//                 <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                   <span style={{ color: "#64748b", fontSize: 13 }}>#{h.period}</span>
//                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                     <div style={{ width: 30, height: 30, borderRadius: "50%", background: getColor(h.result), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>
//                       {h.result}
//                     </div>
//                     <span style={{ color: getColor(h.result), fontSize: 13, fontWeight: 600 }}>{getColorLabel(h.result)} · {h.size}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}

//         {/* Leaderboard Tab */}
//         {tab === "leaderboard" && (
//           <div style={S.card}>
//             <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>🏆 Top WinGo Winners</h3>
//             {leaderboard.length === 0 ? <p style={{ color: "#64748b" }}>No data yet</p> : leaderboard.map((e, i) => (
//               <div key={e.uid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", marginBottom: 8, background: "rgba(255,255,255,0.04)", borderRadius: 12 }}>
//                 <div style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#f97316" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: i < 3 ? "#0f172a" : "#64748b" }}>
//                   {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
//                 </div>
//                 <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 }}>
//                   {e.name?.[0] || "?"}
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <div style={{ color: "#e2e8f0", fontWeight: 700 }}>{e.name}</div>
//                 </div>
//                 <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 17 }}>₹{e.totalWon?.toLocaleString()}</div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Stats Tab */}
//         {tab === "stats" && myStats && (
//           <div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
//               {[
//                 { lbl: "Total Wins", val: myStats.wins, icon: "✅", color: "#22c55e" },
//                 { lbl: "Total Losses", val: myStats.losses, icon: "❌", color: "#ef4444" },
//                 { lbl: "Win Rate", val: myStats.wins + myStats.losses > 0 ? `${Math.round(myStats.wins/(myStats.wins+myStats.losses)*100)}%` : "0%", icon: "📈", color: "#f59e0b" },
//                 { lbl: "Total Winnings", val: `₹${(myStats.totalWinnings||0).toLocaleString()}`, icon: "💰", color: "#06b6d4" },
//               ].map(s => (
//                 <div key={s.lbl} style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, textAlign: "center" }}>
//                   <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
//                   <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.val}</div>
//                   <div style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{s.lbl}</div>
//                 </div>
//               ))}
//             </div>
//             <button onClick={() => navigate("/wingo-history")} style={{ display: "block", width: "100%", padding: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
//               📜 View Full Bet History →
//             </button>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }

// const S = {
//   page: { minHeight: "100vh", background: "#1e2348", color: "white", fontFamily: "'Inter','Segoe UI',sans-serif" },
//   wrap: { maxWidth: 500, margin: "0 auto", padding: "20px 16px 80px" },
//   header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
//   balPill: { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e", padding: "7px 14px", borderRadius: 20, fontSize: 14, fontWeight: 700 },
//   tabRow: { display: "flex", gap: 8, marginBottom: 16 },
//   timerCard: { background: "#2b3270", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18, marginBottom: 12 },
//   card: { background: "#2b3270", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, marginBottom: 12 },
//   activeBetCard: { background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(43,50,112,1))", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 16, padding: 16, marginBottom: 12 },
//   lbl: { color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" },
//   infoNote: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 14px", color: "#fbbf24", fontSize: 12.5, marginBottom: 16, lineHeight: 1.5 },
//   lockedNote: { textAlign: "center", padding: "10px", color: "#94a3b8", fontSize: 13, background: "rgba(255,255,255,0.03)", borderRadius: 10 },
//   overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 },
//   modal: { background: "#1e2348", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360 },
//   modalTitle: { margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: "#f1f5f9" },
//   modalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" },
//   modalLbl: { color: "#64748b", fontSize: 14 },
//   modalVal: { fontSize: 17, fontWeight: 700 },
// };

// const css = `
//   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

//   @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
//   @keyframes spin { to { transform: rotate(360deg); } }
//   @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
//   @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
//   @keyframes popupIn {
//     0% { transform: scale(0.6) translateY(40px); opacity: 0; }
//     70% { transform: scale(1.04) translateY(-4px); opacity: 1; }
//     100% { transform: scale(1) translateY(0); opacity: 1; }
//   }
//   @keyframes shuffleBounce {
//     from { transform: scale(1); }
//     to { transform: scale(1.06); }
//   }

//   .backBtn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; padding: 8px 14px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; }
//   .backBtn:hover { background: rgba(255,255,255,0.1); color: white; }
//   .iconBtn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 7px 10px; border-radius: 10px; cursor: pointer; font-size: 16px; }
//   .depositBtn { background: linear-gradient(135deg,#22c55e,#16a34a); border: none; color: white; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; }

//   .tab { flex: 1; padding: 9px 4px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; }
//   .tabActive { flex: 1; padding: 9px 4px; border-radius: 10px; background: rgba(245,158,11,0.18); border: 1px solid rgba(245,158,11,0.45); color: #f59e0b; font-size: 12px; font-weight: 700; cursor: pointer; }

//   .qAmt { padding: 7px 12px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
//   .qAmt:hover:not(:disabled) { background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.45); color: #f59e0b; }
//   .qAmt:disabled { opacity: 0.35; cursor: not-allowed; }
//   .qAmtActive { padding: 7px 12px; border-radius: 8px; background: rgba(245,158,11,0.25); border: 1px solid rgba(245,158,11,0.6); color: #f59e0b; font-size: 13px; font-weight: 800; cursor: pointer; }
//   .qAmtActive:disabled { opacity: 0.6; cursor: not-allowed; }
//   .amtInput { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: white; font-size: 14px; padding: 7px 10px; outline: none; width: 80px; }
//   .amtInput:focus { border-color: rgba(245,158,11,0.5); }
//   .amtInput:disabled { opacity: 0.4; cursor: not-allowed; }

//   .betBtnGreen { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #16a34a; color: white; box-shadow: 0 4px 14px #16a34a88; }
//   .betBtnGreen:hover:not(:disabled) { background: #15803d; transform: translateY(-2px); }
//   .betBtnGreen:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

//   .betBtnViolet { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #9333ea; color: white; box-shadow: 0 4px 14px #9333ea88; }
//   .betBtnViolet:hover:not(:disabled) { background: #7e22ce; transform: translateY(-2px); }
//   .betBtnViolet:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

//   .betBtnRed { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #dc2626; color: white; box-shadow: 0 4px 14px #dc262688; }
//   .betBtnRed:hover:not(:disabled) { background: #b91c1c; transform: translateY(-2px); }
//   .betBtnRed:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

//   .betBtnBig { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #d97706; color: white; box-shadow: 0 4px 14px #d9770688; }
//   .betBtnBig:hover:not(:disabled) { background: #b45309; transform: translateY(-2px); }
//   .betBtnBig:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

//   .betBtnSmall { flex: 1; padding: 13px 8px; border-radius: 12px; border: none; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #0891b2; color: white; box-shadow: 0 4px 14px #0891b288; }
//   .betBtnSmall:hover:not(:disabled) { background: #0e7490; transform: translateY(-2px); }
//   .betBtnSmall:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

//   .numBtn:hover:not(:disabled) { transform: scale(1.1); }

//   .autoBetOn { padding: 6px 14px; border-radius: 8px; background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.5); color: #22c55e; font-size: 13px; font-weight: 700; cursor: pointer; }
//   .autoBetOff { padding: 6px 14px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; }

//   .viewAllBtn { background: transparent; border: none; color: #f59e0b; font-size: 12px; font-weight: 700; cursor: pointer; }
//   .modalCancel { flex: 1; padding: 13px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer; }
//   .modalConfirm { flex: 1; padding: 13px; border-radius: 10px; background: linear-gradient(135deg,#22c55e,#16a34a); border: none; color: white; font-size: 14px; font-weight: 700; cursor: pointer; }
//   .modalConfirm:disabled { opacity: 0.6; cursor: not-allowed; }

//   .cancelBetBtn { width: 100%; padding: 12px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #ef4444; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
//   .cancelBetBtn:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
//   .cancelBetBtn:disabled { opacity: 0.6; cursor: not-allowed; }

//   .btnSpinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
// `;