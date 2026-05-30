import React, { useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LogOut, Home, User, Briefcase } from 'lucide-react';
import '../admin/Admin.css'; // Reusing some base styles

const CandidateLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStyle = (path) => {
    const active = location.pathname === path;
    return {
      width: '100%',
      background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      color: active ? '#2563eb' : '#64748b',
      fontWeight: 500,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s ease'
    };
  };

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar - specific to Candidate */}
      <div className="sidebar" style={{ width: '250px', background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={24} /> HireAI
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.5rem', display: 'block' }}>
            Candidate Portal
          </span>
        </div>
        
        <nav className="sidebar-nav" style={{ flex: 1, padding: '1.5rem 1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <button onClick={() => navigate('/candidate/dashboard')} className="nav-item" style={getStyle('/candidate/dashboard')}>
                <Home size={20} /> My Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/candidate/jobs')} className="nav-item" style={getStyle('/candidate/jobs')}>
                <Briefcase size={20} /> Browse Jobs
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/candidate/profile')} className="nav-item" style={getStyle('/candidate/profile')}>
                <User size={20} /> Profile & Resume
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer" style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
          <button className="nav-item logout-btn" onClick={handleLogout} style={{ width: '100%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', color: '#ef4444', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="top-header" style={{ height: '70px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2rem' }}>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              {user?.name?.charAt(0) || 'C'}
            </div>
            <div className="user-info">
              <span className="user-name" style={{ display: 'block', fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{user?.name || 'Candidate'}</span>
            </div>
          </div>
        </header>
        <div className="content-area" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CandidateLayout;
