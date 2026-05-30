import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Public/Candidate pages
import PublicJobs from './pages/PublicJobs';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Jobs from './pages/admin/Jobs';
import Candidates from './pages/admin/Candidates';
import Settings from './pages/admin/Settings';
import CandidateProfile from './pages/admin/CandidateProfile';
import LiveInterview from './pages/admin/LiveInterview';

// Candidate Pages
import CandidateLayout from './pages/candidate/CandidateLayout';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateJobs from './pages/candidate/CandidateJobs';
import CandidateProfilePage from './pages/candidate/CandidateProfilePage';
import CandidateInterview from './pages/candidate/CandidateInterview';
import CandidateAssessment from './pages/candidate/CandidateAssessment';

// Shared Layout for public pages that includes the Navbar
const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <div className="main-content">
        <Outlet />
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="app-layout">
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/jobs" element={<PublicJobs />} />
              </Route>

              {/* Admin Routes (Protected) */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['Admin', 'Recruiter', 'Interviewer']}>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="candidates" element={<Candidates />} />
                <Route path="candidates/:id" element={<CandidateProfile />} />
                <Route path="interview/:id" element={<LiveInterview />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Candidate Routes (Protected) */}
              <Route path="/candidate" element={
                <ProtectedRoute allowedRoles={['Candidate']}>
                  <CandidateLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<CandidateDashboard />} />
                <Route path="jobs" element={<CandidateJobs />} />
                <Route path="profile" element={<CandidateProfilePage />} />
              </Route>
              
              {/* Candidate Interview Room (No Layout) */}
              <Route path="/candidate/interview/:id" element={
                <ProtectedRoute allowedRoles={['Candidate']}>
                  <CandidateInterview />
                </ProtectedRoute>
              } />

              {/* Candidate Assessment (No Layout) */}
              <Route path="/candidate/assessment/:id" element={
                <ProtectedRoute allowedRoles={['Candidate']}>
                  <CandidateAssessment />
                </ProtectedRoute>
              } />

            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
