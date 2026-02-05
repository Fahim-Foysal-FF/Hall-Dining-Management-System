import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Student pages
import StudentDashboard from './pages/Student/StudentDashboard';
import Schedule from './pages/Student/Schedule';
import BuyToken from './pages/Student/BuyToken';
import MyTokens from './pages/Student/MyTokens';
import Marketplace from './pages/Student/Marketplace';
import Wallet from './pages/Student/Wallet';
import StudentFeedback from './pages/Student/Feedback';
import StudentReports from './pages/Student/StudentReports';
import StudentComplaints from './pages/Student/StudentComplaints';
import StudentNoticeBoard from './pages/Student/StudentNoticeBoard';

// Admin pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageMenu from './pages/Admin/ManageMenu';
import AdminWallets from './pages/Admin/AdminWallets';
import AdminFeedback from './pages/Admin/AdminFeedback';
import AdminTokens from './pages/Admin/AdminTokens';
import AdminMeals from './pages/Admin/AdminMeals';
import AdminScan from './pages/Admin/AdminScan';
import TokenDebug from './pages/Admin/TokenDebug';
import AdminReports from './pages/Admin/AdminReports';
import AdminNotices from './pages/Admin/AdminNotices';
import AdminComplaints from './pages/Admin/AdminComplaints';
import AdminDiningClosure from './pages/Admin/AdminDiningClosure';
import UserModeration from './pages/Admin/UserModeration';

// Shared
import Profile from './pages/Account/Profile';

function App() {
  return (
    <Routes>
      {/* Public auth routes (with their own Navbar inside the pages) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Payment callback routes - redirect to wallet */}
      <Route path="/payment/success" element={<Navigate to="/student/wallet?payment=success" replace />} />
      <Route path="/payment/fail" element={<Navigate to="/student/wallet?payment=failed" replace />} />
      <Route path="/payment/cancel" element={<Navigate to="/student/wallet?payment=cancelled" replace />} />

      {/* Routes that use the shared layout (Navbar + main container) */}
      <Route element={<Layout />}>
        {/* Student-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/schedule" element={<Schedule />} />
          <Route path="/student/buy-token" element={<BuyToken />} />
          <Route path="/student/my-tokens" element={<MyTokens />} />
          <Route path="/student/market" element={<Marketplace />} />
          <Route path="/student/wallet" element={<Wallet />} />
          <Route path="/student/feedback" element={<StudentFeedback />} />
          <Route path="/student/reports" element={<StudentReports />} />
          <Route path="/student/complaints" element={<StudentComplaints />} />
          <Route path="/student/notices" element={<StudentNoticeBoard />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/meal-plan" element={<ManageMenu />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/wallets" element={<AdminWallets />} />
          <Route path="/admin/tokens" element={<AdminTokens />} />
          <Route path="/admin/meals" element={<AdminMeals />} />
          <Route path="/admin/manual-verify" element={<AdminScan />} />
          <Route path="/admin/scan" element={<AdminScan />} />
          <Route path="/admin/token-debug" element={<TokenDebug />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/notices" element={<AdminNotices />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
          <Route path="/admin/dining-closure" element={<AdminDiningClosure />} />
          <Route path="/admin/moderation" element={<UserModeration />} />
          {/* Later: /admin/tokens, /admin/wallets, /admin/meals-summary, etc. */}
        </Route>

        {/* Shared profile route: Student or Admin */}
        <Route
          element={<ProtectedRoute allowedRoles={['Student', 'Admin']} />}
        >
          <Route path="/account/profile" element={<Profile />} />
        </Route>

        {/* Default inside layout */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;