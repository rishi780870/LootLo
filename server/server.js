const express = require("express");
const cors = require("cors");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const app = express();

app.use(cors());
app.use(express.json());

// ── Root ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "running", name: "LootLo Backend 🚀", time: new Date().toISOString() });
});

// ── Health check ─────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ── Get current game state ────────────────────────────────────────────
app.get("/gamestate", async (req, res) => {
  try {
    const snap = await db.collection("gameState").doc("current").get();
    if (!snap.exists) return res.status(404).json({ error: "No game state" });
    res.json(snap.data());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Get leaderboard ──────────────────────────────────────────────────
app.get("/leaderboard", async (req, res) => {
  try {
    const snap = await db.collection("leaderboard").doc("wingo").get();
    if (!snap.exists) return res.json({ top10: [] });
    res.json(snap.data());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Get recent game history ──────────────────────────────────────────
app.get("/history", async (req, res) => {
  try {
    const snap = await db.collection("wingoHistory")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 LootLo Backend running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}\n`);
});

// ── Helper: get color info ────────────────────────────────────────────
function getColorInfo(num) {
  if ([0, 5].includes(num)) return { color: "Violet", size: num >= 5 ? "Big" : "Small" };
  if ([1, 3, 7, 9].includes(num)) return { color: "Green", size: num >= 5 ? "Big" : "Small" };
  return { color: "Red", size: num >= 5 ? "Big" : "Small" };
}

// ── Multipliers (WinGo standard) ──────────────────────────────────────
function calcPayout(bet, result) {
  const { color, size } = getColorInfo(result);
  let won = false;
  let multiplier = 0;

  if (bet.type === "number" && Number(bet.value) === result) {
    won = true; multiplier = 9;
  } else if (bet.type === "color" && bet.value === "Green" && color === "Green") {
    won = true; multiplier = 2;
  } else if (bet.type === "color" && bet.value === "Red" && color === "Red") {
    won = true; multiplier = 2;
  } else if (bet.type === "color" && bet.value === "Violet" && color === "Violet") {
    won = true; multiplier = 4.5;
  } else if (bet.type === "size" && bet.value === "Big" && size === "Big") {
    won = true; multiplier = 2;
  } else if (bet.type === "size" && bet.value === "Small" && size === "Small") {
    won = true; multiplier = 2;
  }

  return { won, payout: won ? Math.floor(bet.amount * multiplier) : 0 };
}

// ── Main game loop (every 1 second) ──────────────────────────────────
setInterval(async () => {
  try {
    const gameRef = db.collection("gameState").doc("current");
    const gameDoc = await gameRef.get();
    if (!gameDoc.exists) return;

    const game = gameDoc.data();
    const phase = game.phase || "betting";
    const elapsed = Math.floor((Date.now() - game.startTime) / 1000);

    // ── BETTING → RESULT ─────────────────────────────────────────────
    if (phase === "betting" && elapsed >= 30) {
      const result = Math.floor(Math.random() * 10);
      const { color, size } = getColorInfo(result);

      console.log(`\n=== Period ${game.period} | Result: ${result} (${color}, ${size}) ===`);

      // Settle all pending bets for this period
      const betsSnap = await db
        .collection("userBets")
        .where("status", "==", "pending")
        .where("period", "==", game.period)
        .get();

      console.log(`Bets to settle: ${betsSnap.size}`);

      // Batch updates for performance
      const batch = db.batch();
      const userUpdates = {};

      for (const betDoc of betsSnap.docs) {
        const bet = betDoc.data();
        const { won, payout } = calcPayout(bet, result);

        batch.update(betDoc.ref, {
          status: won ? "won" : "lost",
          result,
          resultColor: color,
          resultSize: size,
          payout,
          settledAt: Date.now(),
        });

        // Aggregate user updates
        if (!userUpdates[bet.uid]) {
          userUpdates[bet.uid] = { balanceDelta: 0, wins: 0, losses: 0, winningsDelta: 0 };
        }
        if (won) {
          userUpdates[bet.uid].balanceDelta += payout;
          userUpdates[bet.uid].winningsDelta += payout;
          userUpdates[bet.uid].wins += 1;
          console.log(`  ✅ ${bet.uid.slice(0, 8)} WON ₹${payout} (${bet.type}: ${bet.value})`);
        } else {
          userUpdates[bet.uid].losses += 1;
          console.log(`  ❌ ${bet.uid.slice(0, 8)} LOST (${bet.type}: ${bet.value})`);
        }
      }

      await batch.commit();

      // Apply user balance updates
      for (const [uid, updates] of Object.entries(userUpdates)) {
        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          await userRef.update({
            balance: (userData.balance || 0) + updates.balanceDelta,
            totalWinnings: (userData.totalWinnings || 0) + updates.winningsDelta,
            wingoWins: (userData.wingoWins || 0) + updates.wins,
            wingoLosses: (userData.wingoLosses || 0) + updates.losses,
          });
        }
      }

      // Save round to history
      await db.collection("wingoHistory").add({
        period: game.period,
        result,
        color,
        size,
        totalBets: betsSnap.size,
        createdAt: Date.now(),
      });

      // Update leaderboard
      await updateLeaderboard();

      // Move to result phase
      await gameRef.update({
        phase: "result",
        result,
        resultColor: color,
        resultSize: size,
        resultTime: Date.now(),
      });

      console.log(`Period ${game.period} done. Showing result for 5s.`);
    }

    // ── RESULT → NEW BETTING ──────────────────────────────────────────
    else if (phase === "result") {
      const resultElapsed = Math.floor((Date.now() - game.resultTime) / 1000);
      if (resultElapsed >= 5) {
        const newPeriod = Number(game.period) + 1;
        await gameRef.update({
          phase: "betting",
          period: newPeriod,
          startTime: Date.now(),
        });
        console.log(`\n⏳ New period started: #${newPeriod}`);
      }
    }

  } catch (err) {
    console.error("Game loop error:", err.message);
  }
}, 1000);

// ── Leaderboard update ────────────────────────────────────────────────
async function updateLeaderboard() {
  try {
    const betsSnap = await db
      .collection("userBets")
      .where("status", "==", "won")
      .get();

    const totals = {};
    betsSnap.docs.forEach((d) => {
      const b = d.data();
      if (!b.uid) return;
      if (!totals[b.uid]) {
        totals[b.uid] = { uid: b.uid, totalWon: 0, name: b.userName || "Player" };
      }
      totals[b.uid].totalWon += b.payout || 0;
    });

    const sorted = Object.values(totals)
      .sort((a, b) => b.totalWon - a.totalWon)
      .slice(0, 10);

    await db.collection("leaderboard").doc("wingo").set({
      top10: sorted,
      updatedAt: Date.now(),
    });

    console.log(`📊 Leaderboard updated (${sorted.length} players)`);
  } catch (e) {
    console.error("Leaderboard error:", e.message);
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("Server shutting down gracefully...");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("\nServer stopped.");
  process.exit(0);
});