import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Video, Settings, Code, FileText, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import './AdminPages.css';

const LiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const { showToast } = useToast();
  
  // Editor State
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")');
  const [notes, setNotes] = useState('');

  const socketRef = useRef(null);
  const codeRef = useRef(code);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const boilerplates = {
    python: '# Write your Python code here\nprint("Hello, World!")',
    java: '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    cpp: '// Write your C++ code here\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const newBoilerplate = boilerplates[newLang];
    setCode(newBoilerplate);
    if (socketRef.current) {
      socketRef.current.emit('language-update', { roomId: id, language: newLang });
      socketRef.current.emit('code-update', { roomId: id, code: newBoilerplate });
    }
  };

  const handleEditorChange = (value) => {
    setCode(value);
    if (socketRef.current && value !== codeRef.current) {
      socketRef.current.emit('code-update', { roomId: id, code: value });
    }
  };

  // Video State
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  // Decision Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    fetchCandidate();
    startVideo();

    // Socket Connection Setup
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join-room', { roomId: id, role: 'Interviewer' });

    socketRef.current.on('code-update', (newCode) => {
      if (newCode !== codeRef.current) {
        setCode(newCode);
      }
    });

    socketRef.current.on('language-update', (newLang) => {
      setLanguage(newLang);
    });

    socketRef.current.on('user-joined', ({ role }) => {
      if (role === 'Candidate') {
        showToast('Candidate has joined the interview room!', 'success');
      }
    });

    socketRef.current.on('user-left', ({ role }) => {
      if (role === 'Candidate') {
        showToast('Candidate has disconnected from the interview room.', 'warning');
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/candidates/${id}`);
      if (res.data.success) {
        setCandidate(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch candidate", err);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setVideoError(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setVideoError(true);
    }
  };

  const handleEndInterviewClick = () => {
    setShowDecisionModal(true);
  };

  const handleDecision = async (decision) => {
    setSubmittingDecision(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/candidates/${id}/decision`, { decision });
      if (res.data.success) {
        showToast(`Success: ${decision === 'accept' ? 'Offer' : 'Rejection'} sent to ${candidate.email}!`, 'success');
        navigate('/admin/candidates');
      }
    } catch (err) {
      console.error("Failed to submit decision", err);
      showToast("Failed to submit decision. Is the backend running?", 'error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (!candidate) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Interview Room...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      
      {/* Top Navigation Bar */}
      <div style={{ height: '60px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/admin/candidates')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Video size={18} style={{ color: '#ef4444' }} /> Live Interview Room
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select 
            value={language} 
            onChange={handleLanguageChange}
            style={{ background: '#334155', color: '#f8fafc', border: '1px solid #475569', padding: '0.4rem 0.8rem', borderRadius: '6px', outline: 'none' }}
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleEndInterviewClick}>
            End Interview
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar: Candidate Context */}
        <div style={{ width: '320px', background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
          
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{candidate.name}</h3>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{candidate.role}</span>
              </div>
            </div>
            
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>AI Match</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{candidate.match}%</span>
              </div>
              <div style={{ height: '1px', background: '#334155' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Screening Score</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{candidate.scores?.screening || 'N/A'}/10</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Tech Score</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{candidate.scores?.technical || 'N/A'}/100</span>
              </div>
            </div>
          </div>

          {/* Video Feed Placeholder */}
          <div style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', height: '160px', position: 'relative', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {videoError ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#f87171' }}>
                  <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Camera Access Required</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Candidate video is compulsory</div>
                </div>
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                />
              )}
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: videoError ? '#f87171' : '#10b981' }}></span>
                {candidate.name}
              </div>
            </div>
          </div>

          <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
              <FileText size={16} /> Interviewer Notes
            </h4>
            <textarea 
              style={{ flex: 1, width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '1rem', color: '#f8fafc', resize: 'none', outline: 'none' }}
              placeholder="Jot down notes during the interview here. Only you can see this."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Area: Monaco Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.75rem 1.5rem', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
            <Code size={16} /> <span>Live Code Editor ({language})</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={12} /> {candidate.name} is connected
            </span>
          </div>
          
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 20 }
              }}
            />
          </div>
        </div>
        
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="modal-overlay" style={{ zIndex: 3000, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', maxWidth: '500px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #334155' }}>
              <h3 style={{ margin: 0 }}>End Interview & Final Decision</h3>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem' }}>
              <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                You are about to end the live interview with <strong>{candidate.name}</strong>. Please review your notes and make a final hiring decision. This will trigger an automated email to the candidate.
              </p>
              
              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Notes</h4>
                <div style={{ color: '#f8fafc', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                  {notes || <span style={{ color: '#64748b', fontStyle: 'italic' }}>No notes taken during the interview.</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  onClick={() => handleDecision('reject')}
                  disabled={submittingDecision}
                  style={{ background: '#0f172a', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: submittingDecision ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: submittingDecision ? 0.7 : 1 }}
                  onMouseEnter={(e) => { if(!submittingDecision) { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}}
                  onMouseLeave={(e) => { if(!submittingDecision) { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#ef4444'; }}}
                >
                  <XCircle size={28} />
                  <span style={{ fontWeight: 600 }}>Reject Candidate</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Sends rejection email</span>
                </button>

                <button 
                  onClick={() => handleDecision('accept')}
                  disabled={submittingDecision}
                  style={{ background: '#0f172a', border: '1px solid #10b981', color: '#10b981', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: submittingDecision ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: submittingDecision ? 0.7 : 1 }}
                  onMouseEnter={(e) => { if(!submittingDecision) { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }}}
                  onMouseLeave={(e) => { if(!submittingDecision) { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#10b981'; }}}
                >
                  <CheckCircle size={28} />
                  <span style={{ fontWeight: 600 }}>Accept & Hire</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Sends official offer email</span>
                </button>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#1e293b', borderTop: '1px solid #334155', justifyContent: 'center' }}>
              <button 
                className="btn btn-ghost" 
                style={{ color: '#94a3b8' }} 
                onClick={() => setShowDecisionModal(false)}
                disabled={submittingDecision}
              >
                Cancel & Return to Interview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveInterview;
