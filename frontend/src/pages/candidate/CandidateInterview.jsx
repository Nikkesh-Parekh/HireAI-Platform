import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Video, Settings, Code, FileText, User, AlertTriangle } from 'lucide-react';
import '../admin/AdminPages.css';

const CandidateInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Editor State
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")');

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

  useEffect(() => {
    startVideo();

    // Socket Connection Setup
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join-room', { roomId: id, role: 'Candidate' });

    socketRef.current.on('code-update', (newCode) => {
      if (newCode !== codeRef.current) {
        setCode(newCode);
      }
    });

    socketRef.current.on('language-update', (newLang) => {
      setLanguage(newLang);
    });

    socketRef.current.on('user-joined', ({ role }) => {
      if (role === 'Interviewer') {
        showToast('Interviewer has joined the session!', 'success');
      }
    });

    socketRef.current.on('user-left', ({ role }) => {
      if (role === 'Interviewer') {
        showToast('Interviewer has left the session.', 'warning');
      }
    });
    
    // Cleanup video stream and socket on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

  const handleLeaveRoom = () => {
    if(window.confirm("Are you sure you want to leave the interview room?")) {
      navigate('/candidate/dashboard');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      
      {/* Top Navigation Bar */}
      <div style={{ height: '60px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={handleLeaveRoom} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Video size={18} style={{ color: '#10b981' }} /> Live Interview Room
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
          <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleLeaveRoom}>
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Panel - Video & Details */}
        <div style={{ width: '300px', background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>Your Video Feed</h3>
            
            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', height: '200px', position: 'relative', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {videoError ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#f87171' }}>
                  <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Camera Blocked</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Please allow camera access</div>
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
            </div>
            
            {videoError && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                Your interviewer will not be able to see you. Please check your browser permissions and ensure your camera is not in use by another application.
              </div>
            )}
          </div>
          
          <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
              <Code size={16} /> Interview Instructions
            </h4>
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>1. The interviewer will provide the problem statement verbally or drop it in the code editor.</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>2. Use the dropdown above to select your preferred language.</p>
              <p style={{ margin: 0 }}>3. Talk through your thought process as you write your solution.</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              padding: { top: 16 }
            }}
          />
        </div>
        
      </div>
    </div>
  );
};

export default CandidateInterview;
