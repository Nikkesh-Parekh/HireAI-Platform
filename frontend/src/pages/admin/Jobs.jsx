import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2, Eye, Users, Briefcase, MapPin, Clock, FileText, GraduationCap } from 'lucide-react';
import './AdminPages.css';

const Jobs = () => {
  const [showModal, setShowModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({ title: '', department: 'Engineering', location: '', salary: '', employmentType: 'Full-time', experienceLevel: 'Mid Level', deadline: '', eligibility_cgpa: '', eligibility_skills: '', description: '', status: 'Active' });
  const [viewJob, setViewJob] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const location = useLocation();

  // ─── Fetch Jobs from DB ───
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/jobs');
      if (res.data.success) {
        setJobs(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this job posting?")) {
      try {
        await axios.delete(`http://localhost:5000/api/jobs/${id}`);
        fetchJobs();
      } catch (err) {
        console.error("Failed to delete job", err);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/jobs/${id}/status`);
      fetchJobs();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleEdit = (job) => {
    setEditingJobId(job._id);
    setFormData({
      title: job.title || '',
      department: job.department || 'Engineering',
      location: job.location || '',
      salary: job.salary || '',
      employmentType: job.employmentType || 'Full-time',
      experienceLevel: job.experienceLevel || 'Mid Level',
      deadline: job.deadline || '',
      eligibility_cgpa: job.eligibility?.cgpa || '',
      eligibility_skills: job.eligibility?.skills || '',
      description: job.description || '',
      status: job.status || 'Active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert("Please enter a job title!");
      return;
    }

    const payload = {
      title: formData.title,
      department: formData.department,
      location: formData.location,
      salary: formData.salary,
      employmentType: formData.employmentType,
      experienceLevel: formData.experienceLevel,
      deadline: formData.deadline,
      eligibility: {
        cgpa: formData.eligibility_cgpa,
        skills: formData.eligibility_skills
      },
      description: formData.description,
      status: formData.status
    };
    
    try {
      if (editingJobId) {
        await axios.put(`http://localhost:5000/api/jobs/${editingJobId}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/jobs', payload);
      }
      fetchJobs();
      setShowModal(false);
      setEditingJobId(null);
      setFormData({ title: '', department: 'Engineering', location: '', salary: '', employmentType: 'Full-time', experienceLevel: 'Mid Level', deadline: '', eligibility_cgpa: '', eligibility_skills: '', description: '', status: 'Active' });
    } catch (err) {
      console.error("Failed to save job", err);
      alert('Failed to save job. Make sure the backend is running.');
    }
  };

  const openNewJobModal = () => {
    setEditingJobId(null);
    setFormData({ title: '', department: 'Engineering', location: '', salary: '', employmentType: 'Full-time', experienceLevel: 'Mid Level', deadline: '', eligibility_cgpa: '', eligibility_skills: '', description: '', status: 'Active' });
    setShowModal(true);
  };

  useEffect(() => {
    if (location.state?.openNewJobModal) {
      openNewJobModal();
      // Clear the state so it doesn't reopen if the user refreshes the page
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Manage Jobs</h2>
          <p className="text-muted">Create and manage your active job postings</p>
        </div>
        <button className="btn btn-primary" onClick={openNewJobModal}>
          <Plus size={18} /> Post New Job
        </button>
      </div>

      <div className="card">
        {jobs.length === 0 ? (
          <div style={{padding: '3rem', textAlign: 'center', color: '#64748b'}}>
            <h3>No jobs found</h3>
            <p>Click "Post New Job" to create your first listing.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Location</th>
                <th>Applicants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job._id}>
                  <td>
                    <strong>{job.title}</strong>
                    <div className="text-muted" style={{fontSize: '0.8rem', marginTop: '4px'}}>
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>{job.department}</td>
                  <td>{job.location}</td>
                  <td>
                    <div className="applicant-count">
                      <Users size={14} /> {job.applicants}
                    </div>
                  </td>
                  <td>
                    <button 
                      className={`status-badge ${job.status.toLowerCase()}`}
                      style={{border: 'none', cursor: 'pointer'}}
                      onClick={() => handleToggleStatus(job._id)}
                      title="Click to toggle status"
                    >
                      {job.status}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="icon-btn-small" title="View details" onClick={() => setViewJob(job)}><Eye size={16} /></button>
                      <button className="icon-btn-small" title="Edit job" onClick={() => handleEdit(job)}><Edit2 size={16} /></button>
                      <button className="icon-btn-small danger" title="Delete job" onClick={() => handleDelete(job._id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Job Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>{editingJobId ? 'Edit Job Posting' : 'Post a New Job'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                    <label style={{fontWeight: 600}}>Job Title {editingJobId && <span style={{fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal'}}>(Cannot be changed)</span>}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      disabled={!!editingJobId}
                      style={{
                        backgroundColor: editingJobId ? '#f8fafc' : '#fff',
                        cursor: editingJobId ? 'not-allowed' : 'text',
                        color: editingJobId ? '#94a3b8' : 'var(--text-main)'
                      }}
                      required
                    />
                  </div>
                  <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                    <label style={{fontWeight: 600}}>Department {editingJobId && <span style={{fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal'}}>(Cannot be changed)</span>}</label>
                    <select 
                      className="form-control"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      disabled={!!editingJobId}
                      style={{
                        backgroundColor: editingJobId ? '#f8fafc' : '#fff',
                        cursor: editingJobId ? 'not-allowed' : 'pointer',
                        color: editingJobId ? '#94a3b8' : 'var(--text-main)',
                        opacity: editingJobId ? 0.8 : 1 // Fix for Safari/Chrome disabled select rendering
                      }}
                    >
                      <option>Engineering</option>
                      <option>Design</option>
                      <option>Product</option>
                      <option>Marketing</option>
                      <option>Sales</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                    <label style={{fontWeight: 600}}>Location</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                    <label style={{fontWeight: 600}}>Salary Range</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    />
                  </div>
                  {editingJobId && (
                    <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                      <label style={{fontWeight: 600}}>Status</label>
                      <select 
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="Active">Active</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                    <label style={{fontWeight: 600}}>Employment Type</label>
                    <select 
                      className="form-control"
                      value={formData.employmentType}
                      onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                    <label style={{fontWeight: 600}}>Experience Level</label>
                    <select 
                      className="form-control"
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                    >
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior">Senior</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                  <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                    <label style={{fontWeight: 600}}>Application Deadline</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                  <label style={{fontWeight: 600}}>Minimum CGPA</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.eligibility_cgpa}
                    onChange={(e) => setFormData({...formData, eligibility_cgpa: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                  <label style={{fontWeight: 600}}>Skills</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.eligibility_skills}
                    onChange={(e) => setFormData({...formData, eligibility_skills: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  <label style={{fontWeight: 600}}>Job Description</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingJobId ? 'Save Changes' : 'Create Job Posting'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Job Modal (The Eye Button Fix) */}
      {viewJob && (
        <div className="modal-overlay" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-content large" style={{ overflowY: 'auto', maxHeight: '90vh', padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.3s ease-out' }}>
            
            {/* Premium Header */}
            <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '2rem', position: 'relative', borderBottom: '1px solid #e2e8f0' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{viewJob.title}</h2>
                  <div style={{ display: 'flex', gap: '1.25rem', color: '#64748b', fontSize: '0.95rem', fontWeight: 500, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Briefcase size={16} /> {viewJob.department}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={16} /> {viewJob.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={16} /> {viewJob.employmentType || 'Full-time'}</span>
                    {viewJob.salary && <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{fontWeight: 700, color: '#10b981'}}>$</span> {viewJob.salary}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => setViewJob(null)} 
                  style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem', padding: 0, flexShrink: 0 }}
                >&times;</button>
              </div>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem', background: '#fff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                
                {/* Left Col: Description */}
                <div>
                  <h4 style={{ color: '#0f172a', marginBottom: '1.25rem', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} style={{ color: '#6366f1' }} /> Job Description
                  </h4>
                  <div style={{ color: '#334155', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>
                    {viewJob.description || 'No detailed description provided for this role yet.'}
                  </div>
                </div>

                {/* Right Col: Eligibility & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Eligibility Card */}
                  <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
                    <h4 style={{ color: '#0f172a', margin: '0 0 1rem 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={16} style={{ color: '#8b5cf6' }} /> Eligibility
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Experience</span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{viewJob.experienceLevel || 'Mid Level'}</span>
                      </div>
                      <div style={{ height: '1px', background: '#f1f5f9' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Min CGPA</span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{viewJob.eligibility?.cgpa || 'N/A'}</span>
                      </div>
                      <div style={{ height: '1px', background: '#f1f5f9' }} />
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.95rem', display: 'block', marginBottom: '0.25rem' }}>Required Skills</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                          {(viewJob.eligibility?.skills || 'Not specified').split(',').map((skill, idx) => (
                            <span key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500 }}>
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Card */}
                  <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
                    <h4 style={{ color: '#0f172a', margin: '0 0 1rem 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} style={{ color: '#ec4899' }} /> Live Stats
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Status</span>
                        <span className={`status-badge ${viewJob.status.toLowerCase()}`}>{viewJob.status}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Applicants</span>
                        <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.75rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem' }}>
                          {viewJob.applicants}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Deadline</span>
                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{viewJob.deadline ? new Date(viewJob.deadline).toLocaleDateString() : 'Rolling'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> Posted on {new Date(viewJob.createdAt).toLocaleDateString()}
                  </div>
                </div>

              </div>
            </div>
            
            <div className="modal-footer" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '1.25rem 2rem' }}>
              <button className="btn btn-ghost" onClick={() => setViewJob(null)}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
