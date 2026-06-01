import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Search, MapPin, Briefcase, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './PublicJobs.css';

const PublicJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs`);
      if (res.data.success) {
        // Only display active jobs
        setJobs(res.data.data.filter(job => job.status === 'Active'));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load jobs. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job) => {
    if (!user) {
      showToast('Please log in or register to apply for this job.', 'info');
      navigate('/login', { state: { from: { pathname: '/jobs' } } });
    } else if (user.role === 'Candidate') {
      showToast(`Redirecting to Candidate Portal to apply for ${job.title}...`, 'success');
      navigate('/candidate/jobs');
    } else {
      showToast('Administrators and recruiters cannot apply for jobs.', 'warning');
    }
  };

  // Get unique departments & types for filters
  const departments = [...new Set(jobs.map(j => j.department))];
  const types = [...new Set(jobs.map(j => j.employmentType))];

  // Filtering logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept ? job.department === selectedDept : true;
    const matchesType = selectedType ? job.employmentType === selectedType : true;
    return matchesSearch && matchesDept && matchesType;
  });

  return (
    <div className="public-jobs-container">
      <div className="jobs-hero">
        <h1>Explore Opportunities</h1>
        <p>Join our team of builders and innovators. Find a role that matches your skills and passions.</p>
      </div>

      <div className="jobs-search-filters">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search by title, department, or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select 
          className="filter-select"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((dept, idx) => (
            <option key={idx} value={dept}>{dept}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">All Job Types</option>
          {types.map((type, idx) => (
            <option key={idx} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: '#3b82f6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <span>Loading open roles...</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(30, 41, 59, 0.2)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
          <AlertCircle size={40} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffffff' }}>No matching jobs found</h3>
          <p style={{ margin: 0, color: '#94a3b8' }}>Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="jobs-list">
          {filteredJobs.map(job => (
            <div key={job._id} className="job-card">
              <div>
                <div className="job-info-header">
                  <h3 className="job-title">{job.title}</h3>
                </div>
                <div className="job-tags">
                  <span className="job-tag"><Briefcase size={14} /> {job.department}</span>
                  <span className="job-tag"><MapPin size={14} /> {job.location}</span>
                  <span className="job-tag"><DollarSign size={14} /> {job.salary}</span>
                  <span className="job-tag"><Clock size={14} /> {job.employmentType}</span>
                </div>
              </div>
              <button 
                className="job-apply-btn"
                onClick={() => handleApply(job)}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PublicJobs;
