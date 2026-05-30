import React, { useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Settings, LogOut, Search, Bell } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Briefcase className="logo-icon" size={24} />
          <h2>HireAI Admin</h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard')}`}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </Link>
          <Link to="/admin/jobs" className={`nav-item ${isActive('/admin/jobs')}`}>
            <Briefcase size={20} />
            <span>Manage Jobs</span>
          </Link>
          <Link to="/admin/candidates" className={`nav-item ${isActive('/admin/candidates')}`}>
            <Users size={20} />
            <span>Candidates</span>
          </Link>
          <Link to="/admin/settings" className={`nav-item ${isActive('/admin/settings')}`}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
        
        <div className="sidebar-footer">
          <a href="#" onClick={handleLogout} className="nav-item text-danger">
            <LogOut size={20} />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search jobs, candidates..." />
          </div>
          
          <div className="topbar-actions">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="badge-dot"></span>
            </button>
            <div className="user-profile">
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin+User'}&background=e0e7ff&color=6366f1`} alt="Admin" />
              <div className="user-info">
                <span className="name">{user?.name || 'Admin User'}</span>
                <span className="role">{user?.role || 'Super Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
