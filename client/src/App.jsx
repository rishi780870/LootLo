import { Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import SpinWheel from "./pages/spinwheel";
import Refer from "./pages/refer";
import Withdraw from "./pages/withdraw";
import Deposit from "./pages/Deposit";

import History from "./pages/history";
import WithdrawHistory from "./pages/withdrawHistory";
import AdminDeposit from "./pages/AdminDeposit";
import AdminWithdraw from "./pages/AdminWithdraw";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import DepositHistory from "./pages/DepositHistory";
import SpinHistory from "./pages/SpinHistory";
import ReferralHistory from "./pages/ReferralHistory";
import LoginHistory from "./pages/LoginHistory";
import WinGo from "./pages/WinGO";
import WingoHistory from "./pages/WingoHistory";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/spinwheel" element={<SpinWheel />} />
      <Route path="/refer" element={<Refer />} />
      <Route path="/withdraw" element={<Withdraw />} />
      <Route path="/history" element={<History />} />
      <Route path="/withdraw-history" element={<WithdrawHistory />} />
      <Route path="/spin-history" element={<SpinHistory />} />
      <Route path="/login-history" element={<LoginHistory />} />
      <Route path="/deposit" element={<Deposit />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin-deposit" element={<AdminDeposit />} />
      <Route path="/admin-withdraw" element={<AdminWithdraw />} />
      <Route path="/deposit-history" element={<DepositHistory />} />
      <Route path="/referral-history" element={<ReferralHistory />} />
      <Route path="/wingo" element={<WinGo />} />
      <Route path="/wingo-history" element={<WingoHistory />} />
    </Routes>
  );
}

export default App;