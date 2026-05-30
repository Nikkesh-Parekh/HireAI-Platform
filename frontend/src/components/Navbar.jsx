import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, User, LogIn, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass-navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <Briefcase className="logo-icon" />
          <span>HireAI</span>
        </Link>
        <div className="nav-links">
          <Link to="/jobs" className="nav-link">Jobs</Link>
          <div className="auth-buttons">
            {user ? (
              <>
                <span className="user-greeting" style={{ marginRight: '1rem', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500 }}>
                  Hi, {user.name}
                </span>
                <Link to={user.role === 'Candidate' ? "/candidate/dashboard" : "/admin/dashboard"} className="btn btn-ghost" style={{ marginRight: '0.5rem' }}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f87171' }}>
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  <LogIn size={18} /> Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  <User size={18} /> Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
