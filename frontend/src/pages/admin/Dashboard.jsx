import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Briefcase, FileCheck, TrendingUp, Calendar, Clock, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import './Admin.css'; 

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Auto-reload browser page every 15 seconds
    const interval = setInterval(() => {
      window.location.reload();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, candsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/jobs'),
        axios.get('http://localhost:5000/api/candidates')
      ]);

      if (jobsRes.data.success) setJobs(jobsRes.data.data);
      if (candsRes.data.success) setCandidates(candsRes.data.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Calculate Stats ───
  const activeJobs = jobs.filter(j => j.status === 'Active').length;
  const totalCandidates = candidates.length;
  // Let's count "Applications" as candidates that are currently in the active pipeline (not hired/rejected)
  const activeApplications = candidates.filter(c => !['hired', 'rejected'].includes(c.status)).length;
  const hiredCount = candidates.filter(c => c.status === 'hired').length;

  // ─── Generate Action Items ───
  const getActionItems = () => {
    let items = [];

    candidates.forEach(cand => {
      // 1. Upcoming Interviews
      if (cand.status === 'interview' && cand.interviewSlot && cand.interviewSlot.date) {
        items.push({
          id: `int-${cand._id}`,
          type: 'meeting',
          priority: 1,
          icon: <Calendar size={20} style={{ color: '#8b5cf6' }} />,
          title: 'Upcoming Live Interview',
          description: `Meeting with ${cand.name} for the ${cand.role} role.`,
          meta: `${cand.interviewSlot.date} at ${cand.interviewSlot.startTime || cand.interviewSlot.time || 'TBD'}`,
          actionLabel: 'Join Room',
          action: () => navigate(`/admin/interview/${cand._id}`),
          colorClass: 'purple-theme'
        });
      }
      
      // 2. New Applications (Review required)
      if (cand.status === 'applied') {
        items.push({
          id: `app-${cand._id}`,
          type: 'review',
          priority: 2,
          icon: <FileText size={20} style={{ color: '#3b82f6' }} />,
          title: 'New Application',
          description: `${cand.name} applied for ${cand.role}. AI Match: ${cand.matchScore || cand.match || 0}%.`,
          meta: 'Pending Screening',
          actionLabel: 'Review',
          action: () => navigate('/admin/candidates'),
          colorClass: 'blue-theme'
        });
      }

      // 3. Pending Assessments
      if (cand.status === 'assessment') {
        items.push({
          id: `ass-${cand._id}`,
          type: 'assessment',
          priority: 3,
          icon: <Clock size={20} style={{ color: '#f59e0b' }} />,
          title: 'Technical Assessment',
          description: `Awaiting or reviewing assessment for ${cand.name} (${cand.role}).`,
          meta: cand.scores?.technical ? `Score: ${cand.scores.technical}/100` : 'Pending Completion',
          actionLabel: 'View Board',
          action: () => navigate('/admin/candidates'),
          colorClass: 'orange-theme'
        });
      }
    });

    // Sort by priority
    return items.sort((a, b) => a.priority - b.priority);
  };

  const actionItems = getActionItems();

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/jobs', { state: { openNewJobModal: true } })}>+ Post New Job</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading dashboard data...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper blue"><Briefcase size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Active Jobs</span>
                <h3 className="stat-number">{activeJobs}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper indigo"><Users size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Total Candidates</span>
                <h3 className="stat-number">{totalCandidates}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper green"><FileCheck size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Active Pipeline</span>
                <h3 className="stat-number">{activeApplications}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper purple"><TrendingUp size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Hired Total</span>
                <h3 className="stat-number">{hiredCount}</h3>
              </div>
            </div>
          </div>
          
          <div className="dashboard-sections">
            <div className="card upcoming-tasks" style={{ padding: '0' }}>
              <div className="card-header-inner" style={{ padding: '1.5rem 1.5rem 0.5rem 1.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: 0 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={20} style={{ color: '#6366f1' }}/> Action Items & Tasks
                </h3>
              </div>
              
              <div className="task-list" style={{ display: 'flex', flexDirection: 'column' }}>
                {actionItems.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    You're all caught up! No pending actions.
                  </div>
                ) : (
                  actionItems.slice(0, 8).map((item, index) => (
                    <div key={item.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '1.25rem 1.5rem',
                      borderBottom: index !== Math.min(actionItems.length, 8) - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '10px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: item.colorClass === 'purple-theme' ? '#ede9fe' : item.colorClass === 'blue-theme' ? '#dbeafe' : '#fef3c7'
                        }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>{item.title}</h4>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                              {item.meta}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{item.description}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={item.action}
                        style={{ 
                          background: '#fff', border: '1px solid #e2e8f0', color: '#475569', 
                          padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                      >
                        {item.actionLabel} <ArrowRight size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
