import React, { useState } from 'react';
import { User, Bell, Shield, Database } from 'lucide-react';
import './AdminPages.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const handleSave = () => {
    alert("Settings saved successfully!");
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Platform Settings</h2>
          <p className="text-muted">Configure your platform preferences</p>
        </div>
      </div>

      <div className="settings-container" style={{display: 'flex', gap: '2rem'}}>
        <div className="settings-sidebar" style={{width: '240px'}}>
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><User size={18} /> Profile</div>
          <div className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}><Bell size={18} /> Notifications</div>
          <div className={`nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}><Shield size={18} /> Security</div>
          <div className={`nav-item ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}><Database size={18} /> API & Integrations</div>
        </div>

        <div className="card" style={{flex: 1, padding: '2rem', minHeight: '400px'}}>
          {activeTab === 'profile' && (
            <div className="fade-in">
              <h3>Profile Information</h3>
              <form className="admin-form" style={{marginTop: '1.5rem', maxWidth: '500px'}}>
                <div className="form-group" style={{marginBottom: '1rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Admin Name</label>
                  <input type="text" className="form-control" defaultValue="Admin User" style={{width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                </div>
                <div className="form-group" style={{marginBottom: '1rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Email Address</label>
                  <input type="email" className="form-control" defaultValue="admin@hireai.com" style={{width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                </div>
                <div className="form-group" style={{marginBottom: '1.5rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Role</label>
                  <input type="text" className="form-control" defaultValue="Super Administrator" disabled style={{width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b'}} />
                </div>
                <button type="button" className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="fade-in">
              <h3>Notification Preferences</h3>
              <p className="text-muted" style={{marginTop: '0.5rem'}}>Manage how you receive alerts and updates.</p>
              <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
                  <input type="checkbox" defaultChecked style={{width: '18px', height: '18px'}}/> 
                  <span style={{fontWeight: 500}}>Email alerts for new applications</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
                  <input type="checkbox" defaultChecked style={{width: '18px', height: '18px'}}/> 
                  <span style={{fontWeight: 500}}>Daily summary reports</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'}}>
                  <input type="checkbox" style={{width: '18px', height: '18px'}}/> 
                  <span style={{fontWeight: 500}}>Browser push notifications</span>
                </label>
              </div>
              <button type="button" className="btn btn-primary" style={{marginTop: '2rem'}} onClick={handleSave}>Update Preferences</button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="fade-in">
              <h3>Security Settings</h3>
              <p className="text-muted" style={{marginTop: '0.5rem'}}>Ensure your admin account is secure.</p>
              <div style={{marginTop: '2rem'}}>
                <button type="button" className="btn btn-ghost" onClick={() => alert("Password reset link sent!")}>Change Password</button>
                <button type="button" className="btn btn-primary" style={{marginLeft: '1rem'}} onClick={() => alert("2FA Setup initiated!")}>Enable Two-Factor Auth (2FA)</button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="fade-in">
              <h3>API & Integrations</h3>
              <p className="text-muted" style={{marginTop: '0.5rem'}}>Manage developer keys for external service integrations.</p>
              
              <div style={{marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 1rem 0'}}>Current API Key</h4>
                <code style={{background: '#e2e8f0', padding: '0.5rem 1rem', borderRadius: '6px', color: '#0f172a'}}>sk_live_51MabcDefGHIjklMNOpqrstu</code>
                <button className="icon-btn-small" style={{marginLeft: '1rem', display: 'inline-flex'}} title="Copy" onClick={() => alert("Copied to clipboard!")}>📋</button>
              </div>

              <button type="button" className="btn btn-primary" style={{marginTop: '1.5rem'}} onClick={() => alert("New API Key generated!")}>Generate New API Key</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
