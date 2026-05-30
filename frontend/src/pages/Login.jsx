import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { token, ...userData } = res.data;
      
      login(userData, token);

      // Determine where to redirect
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (userData.role === 'Candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your HireAI account</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <div style={{position: 'relative'}}>
              <Mail size={18} style={{position: 'absolute', top: '12px', left: '12px', color: '#64748b'}} />
              <input 
                type="email" 
                name="email"
                className="form-control" 
                placeholder="name@company.com"
                style={{paddingLeft: '2.5rem', width: '100%', boxSizing: 'border-box'}}
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div style={{position: 'relative'}}>
              <Lock size={18} style={{position: 'absolute', top: '12px', left: '12px', color: '#64748b'}} />
              <input 
                type="password" 
                name="password"
                className="form-control" 
                placeholder="••••••••"
                style={{paddingLeft: '2.5rem', width: '100%', boxSizing: 'border-box'}}
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem'}}>
            <Link to="/forgot-password" style={{fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500'}}>Forgot password?</Link>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Signing In...' : 'Sign In'} <LogIn size={18} />
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
