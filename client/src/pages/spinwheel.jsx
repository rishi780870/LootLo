import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
} from "firebase/firestore";

function SpinWheel() {
  const wheelItems = [
    "5 Coins",
    "10 Coins",
    "20 Coins",
    "50 Coins",
    "Better Luck",
    "100 Coins",
    "₹400",
    "₹500",
  ];

  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [currentRotation, setCurrentRotation] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setSpinsLeft(snap.data().spinsLeft || 0);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const spinWheel = () => {
    if (spinning) return;

    if (spinsLeft <= 0) {
      alert("No Spins Left. Refer Friends To Get More Spins.");
      return;
    }

    setSpinning(true);
    setResult("");

    // Sirf coins wale indexes — NO ₹400 (6) aur ₹500 (7)
    const allowedIndexes = [0, 1, 2, 3, 4, 5]; // 5C, 10C, 20C, 50C, BetterLuck, 100C

    const winningIndex =
      allowedIndexes[Math.floor(Math.random() * allowedIndexes.length)];

    const reward = wheelItems[winningIndex];

    const totalSlices = wheelItems.length; // 8
    const sliceDeg = 360 / totalSlices;    // 45 deg per slice

    // Slice ka center angle (0 se clockwise)
    const sliceCenterAngle = winningIndex * sliceDeg + sliceDeg / 2;

    // Pointer top par hai (0 deg = top)
    // Wheel rotate hoti hai clockwise
    // Jis slice ko top par laana hai:
    // currentRotation + extraSpin ka result aisa ho ki sliceCenterAngle top par aaye
    const extraSpins = 360 * 8;
    const targetRotation =
      currentRotation + extraSpins + (360 - (currentRotation % 360) - sliceCenterAngle + 360) % 360;

    setRotation(targetRotation);
    setCurrentRotation(targetRotation);

    setTimeout(async () => {
      try {
        setResult(reward);

        const user = auth.currentUser;
        if (!user) {
          setSpinning(false);
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const data = snap.data();

        let rewardCoins = 0;
        if (reward === "5 Coins") rewardCoins = 5;
        if (reward === "10 Coins") rewardCoins = 10;
        if (reward === "20 Coins") rewardCoins = 20;
        if (reward === "50 Coins") rewardCoins = 50;
        if (reward === "100 Coins") rewardCoins = 100;

        await updateDoc(userRef, {
          points: (data.points || 0) + rewardCoins,
          spinsLeft: (data.spinsLeft || 0) - 1,
        });

        await addDoc(collection(db, "spinHistory"), {
          uid: user.uid,
          userName: data.name || "",
          reward: reward,
          rewardCoins: rewardCoins,
          createdAt: new Date(),
        });

        setSpinsLeft((data.spinsLeft || 0) - 1);
        setSpinning(false);
      } catch (error) {
        console.log(error);
        setSpinning(false);
      }
    }, 5000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "60px" }}>🎡 Lucky Spin</h1>

      <h2>Remaining Spins: {spinsLeft}</h2>

      <div style={{ position: "relative", marginTop: "70px" }}>
        {/* Pointer */}
        <div
          style={{
            position: "absolute",
            top: "-70px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "55px",
            zIndex: 9999,
            color: "#facc15",
            textShadow: "0 0 15px #facc15",
          }}
        >
          ⬇
        </div>

        {/* Wheel */}
        <div
          style={{
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            border: "10px solid white",
            position: "relative",
            transition: "transform 5s cubic-bezier(0.17,0.67,0.12,0.99)",
            transform: `rotate(${rotation}deg)`,
            background:
              "conic-gradient(#f59e0b 0deg 45deg,#ef4444 45deg 90deg,#3b82f6 90deg 135deg,#10b981 135deg 180deg,#8b5cf6 180deg 225deg,#06b6d4 225deg 270deg,#84cc16 270deg 315deg,#f97316 315deg 360deg)",
          }}
        >
          {wheelItems.map((item, index) => {
            const angle = index * 45 + 22.5;
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${angle}deg) translateY(-130px) rotate(-${angle}deg)`,
                  fontSize: "14px",
                  fontWeight: "bold",
                  width: "80px",
                  textAlign: "center",
                  color: "white",
                  marginLeft: "-40px",
                }}
              >
                {item}
              </div>
            );
          })}

          {/* Center circle */}
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "#111827",
              borderRadius: "50%",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              border: "5px solid white",
            }}
          />
        </div>
      </div>

      <button
        onClick={spinWheel}
        disabled={spinning}
        style={{
          marginTop: "40px",
          padding: "15px 40px",
          fontSize: "20px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
        }}
      >
        {spinning ? "Spinning..." : "SPIN NOW"}
      </button>

      {result && (
        <div
          style={{
            marginTop: "30px",
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          {result === "Better Luck" ? (
            <>😢 Better Luck Next Time</>
          ) : (
            <>🎉 You Won: {result}</>
          )}
        </div>
      )}
    </div>
  );
}

export default SpinWheel;