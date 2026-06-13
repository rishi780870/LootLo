import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function getColor(num) {
  if ([0,5].includes(num)) return "#a855f7";
  if ([1,3,7,9].includes(num)) return "#22c55e";
  return "#ef4444";
}

export default function WingoHistory() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | won | lost
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const q = query(
        collection(db, "userBets"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      const unsub = onSnapshot(q, (snap) => {
        setBets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      return () => unsub();
    });

    return () => unsubAuth();
  }, []);

  const filtered = bets.filter(b => {
    if (filter === "won") return b.status === "won";
    if (filter === "lost") return b.status === "lost";
    return b.status !== "pending";
  });

  const totalWon = bets.filter(b => b.status === "won").reduce((s, b) => s + (b.payout || 0), 0);
  const totalBet = bets.filter(b => b.status !== "pending").reduce((s, b) => s + (b.amount || 0), 0);
  const wins = bets.filter(b => b.status === "won").length;
  const losses = bets.filter(b => b.status === "lost").length;

  return (
    <div style={{ minHeight: "100vh", background: "#1e2348", color: "white", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "480px", margin: "auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={() => navigate(-1)} style={{ background: "#2b3270", border: "none", color: "white", padding: "8px 14px", borderRadius: "8px", cursor: "pointer" }}>← Back</button>
          <h2 style={{ margin: 0 }}>🎯 WinGo History</h2>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          {[
            { label: "Total Bets", value: wins + losses, icon: "🎲" },
            { label: "Win Rate", value: wins + losses > 0 ? `${Math.round(wins/(wins+losses)*100)}%` : "0%", icon: "📈" },
            { label: "Total Won", value: `₹${totalWon.toLocaleString()}`, icon: "💰" },
            { label: "Net P&L", value: `₹${(totalWon - totalBet).toLocaleString()}`, icon: totalWon >= totalBet ? "📈" : "📉", color: totalWon >= totalBet ? "#22c55e" : "#ef4444" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: "#2b3270", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "20px" }}>{icon}</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: color || "white", marginTop: "4px" }}>{value}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          {["all","won","lost"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px",
              background: filter === f ? "#f59e0b" : "#2b3270", color: "white",
            }}>
              {f === "all" ? "All" : f === "won" ? "✅ Won" : "❌ Lost"}
            </button>
          ))}
        </div>

        {/* Bet list */}
        {loading ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>No bets found</p>
        ) : (
          filtered.map(bet => (
            <div key={bet.id} style={{
              background: "#2b3270", borderRadius: "12px", padding: "14px", marginBottom: "10px",
              borderLeft: `4px solid ${bet.status === "won" ? "#22c55e" : "#ef4444"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>Period #{bet.period}</span>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>
                    {bet.type === "number" ? `Number: ${bet.value}` : bet.type === "color" ? `Color: ${bet.value}` : `Size: ${bet.value}`}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    Bet: ₹{bet.amount}
                    {bet.result !== undefined && (
                      <>
                        {" "} · Result:{" "}
                        <span style={{ color: getColor(bet.result), fontWeight: "bold" }}>{bet.result}</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", fontSize: "18px", color: bet.status === "won" ? "#22c55e" : "#ef4444" }}>
                    {bet.status === "won" ? `+₹${bet.payout}` : `-₹${bet.amount}`}
                  </div>
                  <div style={{ fontSize: "12px", color: bet.status === "won" ? "#22c55e" : "#ef4444", marginTop: "2px" }}>
                    {bet.status === "won" ? "✅ Won" : "❌ Lost"}
                  </div>
                </div>
              </div>

              {bet.createdAt?.toDate && (
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "6px" }}>
                  {bet.createdAt.toDate().toLocaleString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
