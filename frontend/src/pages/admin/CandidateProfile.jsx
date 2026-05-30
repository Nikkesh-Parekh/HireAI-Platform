import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Download, MessageSquare, Briefcase, MapPin, Mail, Phone, GraduationCap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import './AdminPages.css';

const CandidateProfile = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [cand, setCand] = useState(state?.candidate || null);
  const [loading, setLoading] = useState(!cand);

  useEffect(() => {
    if (!cand) {
      fetchCandidate();
    }
  }, [id]);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/candidates/${id}`);
      if (res.data.success) {
        const candData = res.data.data;
        candData.id = candData._id; // Map MongoDB _id to id
        setCand(candData);
      }
    } catch (err) {
      console.error("Failed to fetch candidate details", err);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState('resume');

  const handleDownloadPdf = (e) => {
    e.preventDefault();
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(cand.name, 20, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`${cand.details?.email || ''}  |  ${cand.details?.phone || ''}  |  ${cand.details?.location || ''}`, 20, 30);
    
    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 35, 190, 35);
    
    // Professional Experience
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("PROFESSIONAL EXPERIENCE", 20, 50);
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Senior ${cand.role}`, 20, 60);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("TechCorp Industries  |  2022 - Present", 20, 65);
    
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const bullets = [
      "• Lead the development of scalable web architecture supporting 50k+ daily active users.",
      "• Collaborated with cross-functional teams to deliver critical business features ahead of schedule.",
      "• Mentored junior developers and established internal coding standards."
    ];
    let yPos = 75;
    bullets.forEach(b => {
      const splitB = doc.splitTextToSize(b, 170);
      doc.text(splitB, 20, yPos);
      yPos += splitB.length * 6;
    });
    
    // Education
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("EDUCATION", 20, yPos + 10);
    
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const splitEdu = doc.splitTextToSize(cand.details?.education || 'No education detailed.', 170);
    doc.text(splitEdu, 20, yPos + 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Graduated with Honors, 2020", 20, yPos + 20 + (splitEdu.length * 6));
    
    // Skills
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Top Skills", 20, 125);
    
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text((cand.details?.skills || []).join(', '), 20, 135);
    
    // Trigger Download
    doc.save(`${cand.name.replace(/\s+/g, '_')}_Resume.pdf`);
  };

  if (loading) {
    return (
      <div className="admin-page" style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <h3>Loading Candidate Profile...</h3>
        </div>
      </div>
    );
  }

  if (!cand) {
    return (
      <div className="admin-page" style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Candidate Not Found</h2>
          <p className="text-muted">No candidate data was passed. Please access this page from the Kanban board.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/candidates')} style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page profile-page">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="icon-btn-small" onClick={() => navigate('/admin/candidates')} title="Back to Kanban">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Candidate Profile
            {cand.match && <span className="tag AI-match" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>{cand.match}% AI Match</span>}
          </h2>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>Reviewing application for <strong>{cand.role}</strong></p>
        </div>
        
        <div className="header-actions" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-ghost" onClick={() => alert(`Opening chat with ${cand.name}...`)}>
            <MessageSquare size={16} /> Message
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', flex: 1, minHeight: 0 }}>
        
        {/* Left Sidebar: Context & Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <img src={cand.avatar} alt={cand.name} style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem', border: '4px solid #f1f5f9' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', color: 'var(--text-main)' }}>{cand.name}</h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Briefcase size={14}/> {cand.role}
            </div>
            {cand.details?.location && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14}/> {cand.details.location}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Contact</h4>
            {cand.details?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={14} color="#64748b"/>
                </div>
                {cand.details.email}
              </div>
            )}
            {cand.details?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={14} color="#64748b"/>
                </div>
                {cand.details.phone}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>ATS Assessment</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>AI Match Score</span>
                <strong style={{ color: '#4f46e5' }}>{cand.match || 0}%</strong>
              </div>
              {cand.scores?.screening && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748b' }}>Screening Score</span>
                  <strong>{cand.scores.screening} / 10</strong>
                </div>
              )}
              {cand.scores?.technical && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748b' }}>Technical Test</span>
                  <strong>{cand.scores.technical} / 100</strong>
                </div>
              )}
              {cand.scores?.interview && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748b' }}>Live Interview</span>
                  <strong style={{ color: '#16a34a' }}>{cand.scores.interview} / 100</strong>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: 'auto' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Top Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {cand.details?.skills?.map((skill, index) => (
                <span key={index} style={{ padding: '0.3rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Main Area: CV Viewer & Details */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Internal Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
            <button 
              onClick={() => setActiveTab('resume')}
              style={{ padding: '1rem 1.5rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'resume' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'resume' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Resume / CV
            </button>
            <button 
              onClick={() => setActiveTab('details')}
              style={{ padding: '1rem 1.5rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'details' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'details' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Full Profile
            </button>
          </div>

          {/* Tab Content Container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {activeTab === 'resume' && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Sticky Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#fff', zIndex: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Resume Document</h3>
                  <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={14} /> Download PDF
                  </button>
                </div>
                {/* Mock PDF Viewer (Scrollable) */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                  <div style={{ width: '100%', maxWidth: '650px', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', borderRadius: '4px', padding: '3rem 4rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    
                    {/* Mock Resume Content */}
                    <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>{cand.name}</h1>
                      <p style={{ margin: 0, color: '#64748b' }}>{cand.details?.email} • {cand.details?.phone}</p>
                    </div>

                    <div>
                      <h2 style={{ fontSize: '1.1rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Professional Experience</h2>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#334155' }}>Senior {cand.role}</h3>
                          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>2022 - Present</span>
                        </div>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#64748b' }}>TechCorp Industries</p>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
                          <li>Lead the development of scalable web architecture supporting 50k+ daily active users.</li>
                          <li>Collaborated with cross-functional teams to deliver critical business features ahead of schedule.</li>
                          <li>Mentored junior developers and established internal coding standards.</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h2 style={{ fontSize: '1.1rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Education</h2>
                      <p style={{ margin: 0, color: '#334155', fontWeight: 500 }}>{cand.details?.education}</p>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Graduated with Honors, 2020</p>
                    </div>
                    
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Profile Overview</h3>
                
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Briefcase size={18} color="var(--primary-color)" /> Work Experience
                    </h4>
                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>{cand.details?.experience || 'No experience details provided.'}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={18} color="var(--primary-color)" /> Education Background
                    </h4>
                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>{cand.details?.education || 'No educational details provided.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
