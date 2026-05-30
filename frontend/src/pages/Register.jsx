import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    role: 'Candidate'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      const { token, ...userData } = res.data;
      
      login(userData, token);

      if (userData.role === 'Candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join the next generation hiring platform</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}
          <div className="form-group">
            <label>I am a...</label>
            <div className="role-selection">
              <div className="role-option">
                <input 
                  type="radio" id="role-candidate" name="role" value="Candidate" 
                  checked={formData.role === 'Candidate'} onChange={handleChange} 
                />
                <label htmlFor="role-candidate" className="role-label">Candidate</label>
              </div>
              <div className="role-option">
                <input 
                  type="radio" id="role-recruiter" name="role" value="Recruiter" 
                  checked={formData.role === 'Recruiter'} onChange={handleChange} 
                />
                <label htmlFor="role-recruiter" className="role-label">Recruiter</label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <div style={{position: 'relative'}}>
              <User size={18} style={{position: 'absolute', top: '12px', left: '12px', color: '#64748b'}} />
              <input 
                type="text" 
                name="name"
                className="form-control" 
                placeholder="John Doe"
                style={{paddingLeft: '2.5rem', width: '100%', boxSizing: 'border-box'}}
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

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
                placeholder="Min. 6 characters"
                style={{paddingLeft: '2.5rem', width: '100%', boxSizing: 'border-box'}}
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Creating...' : 'Create Account'} <UserPlus size={18} />
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
