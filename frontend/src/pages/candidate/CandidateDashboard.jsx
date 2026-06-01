import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Briefcase, Clock, FileCheck, CheckCircle, Video, FileQuestion } from 'lucide-react';

const CandidateDashboard = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();

    // Auto-refresh candidate applications silently in the background every 10 seconds
    const interval = setInterval(() => {
      fetchApplications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/candidates/me`);
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = applications.filter(a => !['hired', 'rejected'].includes(a.status)).length;
  const pendingAssessments = applications.filter(a => a.status === 'assessment').length;
  const completedInterviews = applications.filter(a => a.scores?.interview !== null).length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Welcome back, {user?.name}!</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Track your job applications and upcoming interviews.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{activeCount}</h3>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Active Applications</span>
          </div>
        </div>
        
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{pendingAssessments}</h3>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Pending Assessments</span>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{completedInterviews}</h3>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Completed Interviews</span>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Recent Activity</h3>
        </div>
        
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading your applications...</div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <Briefcase size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ margin: 0 }}>You haven't applied to any jobs yet.</p>
            <button onClick={() => navigate('/candidate/jobs')} style={{ marginTop: '1rem', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>
              Browse Jobs
            </button>
          </div>
        ) : (
          <div>
            {applications.map((app, i) => {
              const stages = ['applied', 'assessment', 'interview', 'hired'];
              const currentStageIdx = stages.indexOf(app.status);
              
              return (
                <div key={app._id} style={{ padding: '1.5rem', borderBottom: i !== applications.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a' }}>{app.role}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    {app.status === 'assessment' && app.scores?.technical === null && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '1rem', borderRadius: '8px', textAlign: 'right' }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#d97706', fontSize: '0.85rem', fontWeight: 600 }}>Action Required</p>
                        <p style={{ margin: '0 0 0.75rem 0', color: '#b45309', fontSize: '0.9rem' }}>Technical Assessment is ready.</p>
                        <button onClick={() => navigate(`/candidate/assessment/${app._id}`)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <FileQuestion size={16} /> Take Assessment
                        </button>
                      </div>
                    )}
                    {app.status === 'interview' && app.interviewSlot?.date && (
                      <div style={{ background: '#ede9fe', border: '1px solid #c4b5fd', padding: '1rem', borderRadius: '8px', textAlign: 'right' }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#6d28d9', fontSize: '0.85rem', fontWeight: 600 }}>Upcoming Interview</p>
                        <p style={{ margin: '0 0 0.75rem 0', color: '#4c1d95', fontSize: '0.9rem' }}>{app.interviewSlot.date} at {app.interviewSlot.startTime}</p>
                        <button onClick={() => navigate(`/candidate/interview/${app._id}`)} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Video size={16} /> Join Interview Room
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status Tracker */}
                  {app.status === 'rejected' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fee2e2', padding: '1rem', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                      <span style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 600 }}>Status: Application Closed (Rejected)</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {stages.map((stage, idx) => (
                        <React.Fragment key={stage}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            <div style={{ 
                              width: '30px', height: '30px', borderRadius: '50%', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: idx <= currentStageIdx ? '#10b981' : '#f1f5f9',
                              color: idx <= currentStageIdx ? '#fff' : '#cbd5e1'
                            }}>
                              {idx <= currentStageIdx ? <CheckCircle size={18} /> : <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#cbd5e1'}}></div>}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: idx <= currentStageIdx ? '#0f172a' : '#94a3b8', textTransform: 'capitalize' }}>
                              {stage === 'applied' ? 'Application Sent' : stage}
                            </span>
                          </div>
                          {idx < stages.length - 1 && (
                            <div style={{ height: '2px', flex: 1, background: idx < currentStageIdx ? '#10b981' : '#e2e8f0' }}></div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboard;
