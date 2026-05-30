import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.put(`http://localhost:5000/api/auth/resetpassword/${token}`, {
        password: formData.password
      });

      showToast(res.data?.message || 'Password reset successful! Please log in with your new password.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
      showToast(err.response?.data?.message || 'Failed to reset password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Please enter your new password below</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#64748b' }} />
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Min. 6 characters"
                style={{ paddingLeft: '2.5rem', width: '100%', boxSizing: 'border-box' }}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#64748b' }} />
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                placeholder="Confirm password"
                style={{ paddingLeft: '2.5rem', width: '100%', boxSizing: 'border-box' }}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
          <ArrowLeft size={16} style={{ color: 'var(--primary-color)' }} />
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
