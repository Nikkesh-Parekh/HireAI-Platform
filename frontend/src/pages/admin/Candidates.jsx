import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreHorizontal, MessageSquare, Video, ArrowRight, Star, Clock, Calendar, X, AlertTriangle, Eye, FileText, Mail, Phone, Briefcase, GraduationCap, MapPin, Download } from 'lucide-react';
import './AdminPages.css';

const columnOrder = ['applied', 'assessment', 'interview', 'hired'];
const columnTitles = {
  applied: 'New Applications',
  assessment: 'Technical Assessment',
  interview: 'Live Interview',
  hired: 'Hired'
};

const Candidates = () => {
  const [candidates, setCandidates] = useState({ applied: [], assessment: [], interview: [], hired: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [minMatch, setMinMatch] = useState(0);
  const navigate = useNavigate();

  // Scoring Modal State
  const [scoreModal, setScoreModal] = useState({ open: false, candId: null, fromCol: null, scoreType: '', value: '' });

  // Schedule Modal State
  const [scheduleModal, setScheduleModal] = useState({ open: false, candId: null, fromCol: null, date: '', startTime: '', duration: 30, endTime: '' });
  const [clashWarning, setClashWarning] = useState('');

  // ─── Fetch Data ───
  useEffect(() => {
    fetchCandidates();

    // Auto-reload browser page every 15 seconds for a complete page refresh
    const interval = setInterval(() => {
      window.location.reload();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/candidates');
      if (res.data.success) {
        const grouped = { applied: [], assessment: [], interview: [], hired: [] };
        res.data.data.forEach(c => {
          c.id = c._id; // Map MongoDB _id to id for the frontend logic
          if (grouped[c.status]) {
            grouped[c.status].push(c);
          }
        });
        setCandidates(grouped);
      }
    } catch (err) {
      console.error("Failed to fetch candidates from API", err);
    }
  };

  // ─── Scoring Logic ───

  const openScoreModal = (candId, fromCol) => {
    let scoreType = '';
    if (fromCol === 'applied') scoreType = 'screening';
    if (fromCol === 'assessment') scoreType = 'technical';
    if (fromCol === 'interview') scoreType = 'interview';
    setScoreModal({ open: true, candId, fromCol, scoreType, value: '' });
  };

  const submitScore = async () => {
    const { candId, fromCol, scoreType, value } = scoreModal;
    const numVal = Number(value);

    if (scoreType === 'screening' && (numVal < 1 || numVal > 10)) {
      alert('Screening score must be between 1 and 10.');
      return;
    }
    if ((scoreType === 'technical' || scoreType === 'interview') && (numVal < 0 || numVal > 100)) {
      alert('Score must be between 0 and 100.');
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/candidates/${candId}/score`, { [scoreType]: numVal });
      fetchCandidates();
      setScoreModal({ open: false, candId: null, fromCol: null, scoreType: '', value: '' });
    } catch (err) {
      console.error("Failed to save score to API", err);
      alert('Failed to save score. Please ensure backend is running.');
    }
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ open: false, candId: null, fromCol: null, candName: '', nextStage: '' });

  // ─── Move Forward Logic ───

  const handleAdvanceClick = (candId, fromCol) => {
    const cand = candidates[fromCol].find(c => c.id === candId);
    const currentIndex = columnOrder.indexOf(fromCol);
    const nextStage = columnTitles[columnOrder[currentIndex + 1]];
    setConfirmModal({ open: true, candId, fromCol, candName: cand.name, nextStage });
  };

  const confirmAdvance = () => {
    const { candId, fromCol } = confirmModal;
    setConfirmModal({ open: false, candId: null, fromCol: null, candName: '', nextStage: '' });
    advanceCandidate(candId, fromCol);
  };

  const advanceCandidate = (candId, fromCol) => {
    const cand = candidates[fromCol].find(c => c.id === candId);

    // If advancing from assessment to interview, open the schedule modal first
    if (fromCol === 'assessment') {
      setScheduleModal({ open: true, candId, fromCol, date: '', startTime: '', duration: 30, endTime: '' });
      setClashWarning('');
      return;
    }

    // Otherwise just move forward
    moveForward(candId, fromCol);
  };

  const moveForward = async (candId, fromCol) => {
    const currentIndex = columnOrder.indexOf(fromCol);
    const toCol = columnOrder[currentIndex + 1];

    try {
      await axios.put(`http://localhost:5000/api/candidates/${candId}/advance`, { status: toCol });
      fetchCandidates();
    } catch (err) {
      console.error("Failed to advance candidate via API", err);
      alert('Failed to advance candidate. Please ensure backend is running.');
    }
  };

  // ─── Interview Scheduling & Clash Detection ───

  const getAllInterviewSlots = () => {
    return candidates.interview
      .filter(c => c.interviewSlot)
      .map(c => ({ name: c.name, ...c.interviewSlot }));
  };

  const checkClash = (date, startTime, endTime) => {
    const existingSlots = getAllInterviewSlots();
    const newStart = new Date(`${date}T${startTime}`);
    const newEnd = new Date(`${date}T${endTime}`);

    for (const slot of existingSlots) {
      if (slot.date === date) {
        const existStart = new Date(`${slot.date}T${slot.startTime}`);
        const existEnd = new Date(`${slot.date}T${slot.endTime}`);

        // Check overlap: new interview starts before existing ends AND new interview ends after existing starts
        if (newStart < existEnd && newEnd > existStart) {
          return `⚠️ Time clash with ${slot.name}'s interview (${slot.startTime} – ${slot.endTime}). Please pick a different slot.`;
        }
      }
    }
    return '';
  };

  // Calculate end time from start time + duration (in minutes)
  const calcEndTime = (startTime, duration) => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + duration;
    const endH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
    const endM = String(totalMins % 60).padStart(2, '0');
    return `${endH}:${endM}`;
  };

  const handleScheduleChange = (field, val) => {
    const updated = { ...scheduleModal, [field]: val };

    // Auto-calculate end time whenever start time or duration changes
    if (field === 'startTime' || field === 'duration') {
      const st = field === 'startTime' ? val : updated.startTime;
      const dur = field === 'duration' ? Number(val) : updated.duration;
      updated.endTime = calcEndTime(st, dur);
      if (field === 'duration') updated.duration = dur;
    }

    setScheduleModal(updated);

    // Run clash detection in real-time when all fields are filled
    if (updated.date && updated.startTime && updated.endTime) {
      setClashWarning(checkClash(updated.date, updated.startTime, updated.endTime));
    } else {
      setClashWarning('');
    }
  };

  const submitSchedule = async () => {
    const { candId, fromCol, date, startTime, endTime } = scheduleModal;

    if (!date || !startTime) {
      alert('Please select a date and start time.');
      return;
    }

    // Final clash check
    const clash = checkClash(date, startTime, endTime);
    if (clash) {
      setClashWarning(clash);
      return;
    }

    try {
      // Assign the slot to the candidate
      await axios.put(`http://localhost:5000/api/candidates/${candId}/schedule`, { date, startTime, endTime });
      
      // And move them to the next stage
      await moveForward(candId, fromCol);
      
      setScheduleModal({ open: false, candId: null, fromCol: null, date: '', startTime: '', duration: 30, endTime: '' });
      setClashWarning('');
    } catch (err) {
      console.error("Failed to schedule via API", err);
      alert('Failed to schedule interview. Please ensure backend is running.');
    }
  };

  // ─── Filters ───

  const getFilteredCandidates = (colId) => {
    return candidates[colId].filter(cand => {
      const matchesSearch = cand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            cand.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesScore = cand.match ? cand.match >= minMatch : true;
      return matchesSearch && matchesScore;
    });
  };

  const handleMessage = (name) => {
    alert(`Opening chat with ${name}...`);
  };

  // ─── Score Labels ───

  const getScoreLabel = (type) => {
    if (type === 'screening') return 'Screening Score (1–10)';
    if (type === 'technical') return 'Technical Assessment Score (0–100)';
    if (type === 'interview') return 'Interview Score (0–100)';
    return 'Score';
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Candidate Tracking (ATS)</h2>
          <p className="text-muted">Manage candidate pipelines</p>
        </div>
        <div className="header-actions">
          <div className="search-bar small">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-ghost" onClick={() => setShowFilter(!showFilter)}>
              <Filter size={18} /> Filters {minMatch > 0 && <span className="count-badge" style={{ background: 'var(--primary-color)', color: 'white', marginLeft: '4px' }}>1</span>}
            </button>
            {showFilter && (
              <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '250px', zIndex: 100, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0 }}>Filters</h4>
                  <button className="icon-btn-small" onClick={() => setShowFilter(false)}><X size={14} /></button>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Min AI Match Score: {minMatch}%</label>
                  <input type="range" min="0" max="100" value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))} style={{ width: '100%', marginTop: '0.5rem', cursor: 'pointer' }} />
                </div>
                <button className="btn btn-ghost" style={{ width: '100%', marginTop: '1rem' }} onClick={() => { setMinMatch(0); setShowFilter(false); }}>Clear Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Kanban Board ─── */}
      <div className="kanban-board">
        {columnOrder.map(colId => {
          const filteredList = getFilteredCandidates(colId);
          return (
            <div key={colId} className="kanban-column">
              <div className="column-header">
                <h3>{columnTitles[colId]} <span className="count-badge">{filteredList.length}</span></h3>
              </div>

              <div className="kanban-cards">
                {filteredList.map(cand => (
                  <div key={cand.id} className="kanban-card">
                    <div 
                      className="cand-card-header" 
                      onClick={() => navigate(`/admin/candidates/${cand.id}`, { state: { candidate: cand } })}
                      style={{ cursor: 'pointer' }}
                      title="View Full Profile"
                    >
                      <img src={cand.avatar} alt={cand.name} className="cand-avatar" />
                      <div className="cand-name-role" style={{ flex: 1 }}>
                        <strong>{cand.name}</strong>
                        <span>{cand.role}</span>
                      </div>
                      <button className="icon-btn-small" style={{ border: 'none', background: 'transparent' }}>
                        <Eye size={16} />
                      </button>
                    </div>

                    <div className="cand-card-body">
                      {cand.match && <div className="tag AI-match">AI Match: {cand.match}%</div>}

                      {/* Show scores the candidate has earned */}
                      {cand.scores.screening && <div className="tag score">Screen: {cand.scores.screening}/10</div>}
                      {cand.scores.technical && <div className="tag score">Tech: {cand.scores.technical}/100</div>}
                      {cand.scores.interview && <div className="tag success">Interview: {cand.scores.interview}/100</div>}

                      {/* Show scheduled interview time */}
                      {colId === 'interview' && cand.interviewSlot && (
                        <div className="tag time">
                          <Clock size={12} style={{ marginRight: '4px' }} />
                          {cand.interviewSlot.date} | {cand.interviewSlot.startTime}–{cand.interviewSlot.endTime}
                        </div>
                      )}

                      {colId === 'hired' && <div className="tag success">Offer Accepted ✓</div>}
                    </div>

                    <div className="cand-card-footer">
                      <button className="icon-btn-small" title="Message" onClick={() => handleMessage(cand.name)}>
                        <MessageSquare size={14} />
                      </button>

                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {/* Score button — only show if score for current stage is missing */}
                        {colId === 'applied' && !cand.scores.screening && (
                          <button className="icon-btn-small" title="Add Screening Score" onClick={() => openScoreModal(cand.id, colId)}>
                            <Star size={14} />
                          </button>
                        )}
                        {colId === 'assessment' && !cand.scores.technical && (
                          <button className="icon-btn-small" title="Add Technical Score" onClick={() => openScoreModal(cand.id, colId)}>
                            <Star size={14} />
                          </button>
                        )}
                        {colId === 'interview' && !cand.scores.interview && (
                          <button className="icon-btn-small" title="Add Interview Score" onClick={() => openScoreModal(cand.id, colId)}>
                            <Star size={14} />
                          </button>
                        )}

                        {/* Join Interview button */}
                        {colId === 'interview' && cand.interviewSlot && (
                          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/interview/${cand.id}`)}>
                            <Video size={14} /> Join
                          </button>
                        )}

                        {/* Advance button — hidden in hired column */}
                        {colId !== 'hired' && (
                          <button className="icon-btn-small" title="Advance Candidate" onClick={() => handleAdvanceClick(cand.id, colId)}>
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredList.length === 0 && (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No candidates found
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Confirmation Modal ─── */}
      {confirmModal.open && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '420px'}}>
            <div className="modal-header">
              <h3>Confirm Action</h3>
              <button className="close-btn" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>&times;</button>
            </div>
            <div className="modal-body" style={{textAlign: 'center', padding: '2rem 1.5rem'}}>
              <div style={{width: '56px', height: '56px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'}}>
                <ArrowRight size={24} style={{color: '#6366f1'}} />
              </div>
              <p style={{fontSize: '1rem', color: '#0f172a', marginBottom: '0.5rem'}}>
                Are you sure you want to advance <strong>{confirmModal.candName}</strong> to the <strong>{confirmModal.nextStage}</strong> stage?
              </p>
              <p style={{fontSize: '0.85rem', color: '#64748b'}}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer" style={{justifyContent: 'center'}}>
              <button className="btn btn-ghost" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmAdvance}>Yes, Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Score Modal ─── */}
      {scoreModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Rate Candidate</h3>
              <button className="close-btn" onClick={() => setScoreModal({ ...scoreModal, open: false })}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                Assign a <strong>{scoreModal.scoreType}</strong> score before advancing this candidate.
              </p>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600 }}>{getScoreLabel(scoreModal.scoreType)}</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder={scoreModal.scoreType === 'screening' ? 'e.g. 8' : 'e.g. 85'}
                  value={scoreModal.value}
                  onChange={(e) => setScoreModal({ ...scoreModal, value: e.target.value })}
                  min={scoreModal.scoreType === 'screening' ? 1 : 0}
                  max={scoreModal.scoreType === 'screening' ? 10 : 100}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setScoreModal({ ...scoreModal, open: false })}>Cancel</button>
              <button className="btn btn-primary" onClick={submitScore}>Save Score</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Schedule Interview Modal ─── */}
      {scheduleModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3><Calendar size={20} style={{ marginRight: '8px' }} /> Schedule Interview</h3>
              <button className="close-btn" onClick={() => { setScheduleModal({ ...scheduleModal, open: false }); setClashWarning(''); }}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1.25rem', color: '#64748b' }}>
                Pick a date, time slot, and duration for the interview.
              </p>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 600 }}>Interview Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={scheduleModal.date} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleScheduleChange('date', e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 600 }}>Time Slot</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleScheduleChange('startTime', time)}
                      style={{
                        padding: '0.55rem 0.25rem',
                        borderRadius: '8px',
                        border: scheduleModal.startTime === time ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                        background: scheduleModal.startTime === time ? 'var(--primary-light)' : '#fff',
                        color: scheduleModal.startTime === time ? 'var(--primary-color)' : '#475569',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 600 }}>Duration</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[15, 30, 45, 60, 90].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => handleScheduleChange('duration', dur)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.5rem',
                        borderRadius: '8px',
                        border: scheduleModal.duration === dur ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                        background: scheduleModal.duration === dur ? 'var(--primary-light)' : '#fff',
                        color: scheduleModal.duration === dur ? 'var(--primary-color)' : '#64748b',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {dur < 60 ? `${dur}m` : `${dur / 60}h`}
                    </button>
                  ))}
                </div>
              </div>

              {scheduleModal.startTime && (
                <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.9rem', color: '#166534', fontWeight: 500 }}>
                  ✅ Interview: <strong>{scheduleModal.startTime}</strong> – <strong>{scheduleModal.endTime}</strong> ({scheduleModal.duration} min)
                </div>
              )}

              {clashWarning && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontSize: '0.9rem', fontWeight: 500, marginBottom: '1rem' }}>
                  <AlertTriangle size={18} /> {clashWarning}
                </div>
              )}

              {/* Show existing interviews for context */}
              {getAllInterviewSlots().length > 0 && (
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Existing Interviews</h4>
                  {getAllInterviewSlots().map((slot, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.9rem', borderBottom: i < getAllInterviewSlots().length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <span style={{ fontWeight: 500 }}>{slot.name}</span>
                      <span style={{ color: '#64748b' }}>{slot.date} | {slot.startTime}–{slot.endTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setScheduleModal({ ...scheduleModal, open: false }); setClashWarning(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={submitSchedule} disabled={!!clashWarning}>Confirm & Schedule</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Candidates;
