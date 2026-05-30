import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, MapPin, DollarSign, Clock, FileText, Upload, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CandidateJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Apply Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    location: '',
    experience: '',
    education: '',
    skills: '',
    phone: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();

    // Auto-reload jobs page every 15 seconds ONLY if apply modal is not open
    const interval = setInterval(() => {
      if (!selectedJob) {
        window.location.reload();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      // Fetch jobs, applications and global profile simultaneously
      const [jobsRes, appsRes, profileRes] = await Promise.all([
        axios.get('http://localhost:5000/api/jobs'),
        axios.get('http://localhost:5000/api/candidates/me'),
        axios.get('http://localhost:5000/api/auth/profile').catch(() => null)
      ]);

      if (jobsRes.data.success) {
        setJobs(jobsRes.data.data.filter(j => j.status === 'Active'));
      }
      
      if (appsRes.data.success) {
        setMyApplications(appsRes.data.data);
      }

      if (profileRes && profileRes.data && profileRes.data.success) {
        setProfile(profileRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const appliedRoles = myApplications.map(app => app.role);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    if (profile) {
      setFormData({
        location: profile.location || '',
        experience: profile.experience || '',
        education: profile.education || '',
        skills: profile.skills ? profile.skills.join(', ') : '',
        phone: profile.phone || ''
      });
    } else {
      setFormData({ location: '', experience: '', education: '', skills: '', phone: '' });
    }
    setResumeFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // We must use FormData because we are uploading a file
    const submitData = new FormData();
    submitData.append('role', selectedJob.title);
    submitData.append('location', formData.location);
    submitData.append('experience', formData.experience);
    submitData.append('education', formData.education);
    submitData.append('skills', formData.skills);
    submitData.append('phone', formData.phone);
    
    if (resumeFile) {
      submitData.append('resume', resumeFile);
    } else if (profile && profile.resumeUrl) {
      submitData.append('resumeUrl', profile.resumeUrl);
    }

    try {
      await axios.post('http://localhost:5000/api/candidates', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Successfully applied for ${selectedJob.title}!`);
      setSelectedJob(null);
      navigate('/candidate/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Browse Open Roles</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Find and apply to your next great opportunity.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading active jobs...</div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          No active jobs available at the moment. Please check back later!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map(job => {
            const hasApplied = appliedRoles.includes(job.title);
            
            return (
              <div key={job._id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s', cursor: hasApplied ? 'default' : 'pointer' }} onMouseEnter={e => !hasApplied && (e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)')} onMouseLeave={e => !hasApplied && (e.currentTarget.style.boxShadow = 'none')}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem' }}>{job.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Briefcase size={16}/> {job.department}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={16}/> {job.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><DollarSign size={16}/> {job.salary}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16}/> {job.employmentType}</span>
                  </div>
                </div>
                {hasApplied ? (
                  <button 
                    disabled
                    style={{ background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <CheckCircle size={18} /> Already Applied
                  </button>
                ) : (
                  <button 
                    onClick={() => handleApplyClick(job)}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
                  >
                    Apply Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {selectedJob && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Apply for {selectedJob.title}</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>{selectedJob.department} • {selectedJob.location}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleApplySubmit} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.9rem' }}>Location / City</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.9rem' }}>Phone Number</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.9rem' }}>Relevant Experience (Summary)</label>
                <textarea required value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.9rem' }}>Highest Education</label>
                  <input required type="text" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155', fontSize: '0.9rem' }}>Top Skills (Comma separated)</label>
                  <input required type="text" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc', textAlign: 'center' }}>
                <Upload size={32} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>Upload Resume (PDF only)</h4>
                <input required={!(profile && profile.resumeUrl)} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'block', margin: '0 auto', fontSize: '0.9rem', color: '#64748b' }} />
                {profile && profile.resumeUrl && (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#10b981', fontWeight: 500 }}>
                    ✓ Reusing profile resume: {profile.resumeName || 'Saved Resume'} (or upload a new one)
                  </p>
                )}
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Max file size: 5MB</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setSelectedJob(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {submitting ? 'Submitting...' : <><CheckCircle size={18} /> Submit Application</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateJobs;
