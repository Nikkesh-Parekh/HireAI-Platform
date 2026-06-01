import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, AlertTriangle, Monitor, CheckCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

const QUESTIONS = [
  { id: 1, question: "What is the primary purpose of a RESTful API?", options: ["To style user interfaces", "To provide a standard way for applications to communicate over HTTP", "To securely store passwords in a database", "To manage local file systems"], correctAnswer: 1 },
  { id: 2, question: "Which of the following is NOT a valid React Hook?", options: ["useState", "useEffect", "useRender", "useContext"], correctAnswer: 2 },
  { id: 3, question: "In a relational database, what is a Foreign Key used for?", options: ["To uniquely identify a record in its own table", "To encrypt data fields", "To establish a link between data in two tables", "To speed up database search queries"], correctAnswer: 2 },
  { id: 4, question: "What does 'Big O Notation' describe in computer science?", options: ["The memory size of an object", "The performance or complexity of an algorithm", "The number of classes in an application", "The syntax structure of a programming language"], correctAnswer: 1 },
  { id: 5, question: "Which HTTP method should be used to partially update an existing resource?", options: ["POST", "PUT", "PATCH", "DELETE"], correctAnswer: 2 }
];

const TEST_DURATION_SECONDS = 10 * 60; // 10 minutes

const CandidateAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // States
  const [testState, setTestState] = useState('lobby'); // lobby, running, terminated, completed
  const [terminationReason, setTerminationReason] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);
  const [submitting, setSubmitting] = useState(false);

  // Anti-Cheat: Event Listeners Setup
  useEffect(() => {
    if (testState !== 'running') return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation("You exited fullscreen mode.");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("You switched tabs or minimized the browser.");
      }
    };

    const handleBlur = () => {
      handleViolation("The browser window lost focus (e.g., Alt+Tab or clicked outside).");
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleSelectStart = (e) => e.preventDefault();

    // Attach listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);

    // Timer Interval
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          autoSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      clearInterval(timerInterval);
    };
  }, [testState]);

  const startTest = async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setTestState('running');
      }
    } catch (err) {
      alert("Error attempting to enable fullscreen mode. Please ensure your browser allows it.");
    }
  };

  const handleViolation = (reason) => {
    if (testState === 'running') {
      setTestState('terminated');
      setTerminationReason(reason);
      
      // Attempt to exit fullscreen if still in it
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }

      // Submit a score of 0 or their current progress immediately
      submitScore(0);
    }
  };

  const autoSubmitTest = () => {
    if (testState === 'running') {
      submitScore(calculateScore());
      setTestState('completed');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    return Math.round((correctCount / QUESTIONS.length) * 100);
  };

  const submitScore = async (finalScore) => {
    setSubmitting(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/candidates/${id}/score`, {
        technical: finalScore
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    if (Object.keys(answers).length < QUESTIONS.length) {
      const confirmSubmit = window.confirm("You have unanswered questions. Are you sure you want to submit?");
      if (!confirmSubmit) return;
    }
    autoSubmitTest();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  // LOBBY STATE
  if (testState === 'lobby') {
    return (
      <div ref={containerRef} style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc' }}>
        <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '16px', border: '1px solid #334155', maxWidth: '600px', width: '100%', textAlign: 'center' }}>
          <ShieldAlert size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.8rem' }}>Proctored Assessment</h1>
          <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '2rem' }}>
            This is a strict, proctored environment. Before you begin, please read the following rules carefully. Violating these rules will result in immediate termination of the test.
          </p>
          
          <div style={{ textAlign: 'left', background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ef4444', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> Strict Rules Enforced
            </h3>
            <ul style={{ color: '#cbd5e1', paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><strong>Fullscreen Required:</strong> The test will launch in fullscreen. Pressing ESC will terminate the test.</li>
              <li><strong>No Tab Switching:</strong> Leaving this browser tab or minimizing the window will terminate the test.</li>
              <li><strong>No Focus Loss:</strong> Opening other applications (e.g., Alt+Tab) will terminate the test.</li>
              <li><strong>No Copying:</strong> Right-clicking and text selection have been disabled.</li>
            </ul>
          </div>

          <button 
            onClick={startTest}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Monitor size={20} /> I Understand, Start Fullscreen Test
          </button>
        </div>
      </div>
    );
  }

  // TERMINATED STATE
  if (testState === 'terminated') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc' }}>
        <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '16px', border: '1px solid #ef4444', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#7f1d1d', color: '#f87171', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <AlertTriangle size={40} />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#ef4444', margin: '0 0 1rem 0' }}>Assessment Terminated</h2>
          <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Your assessment was terminated due to a proctoring violation.
          </p>
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', color: '#f87171', fontWeight: 500, marginBottom: '2rem' }}>
            Reason: {terminationReason}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
            A score of 0 has been automatically submitted to the recruitment team.
          </p>
          <button 
            onClick={() => navigate('/candidate/dashboard')}
            style={{ background: '#334155', color: '#fff', border: '1px solid #475569', padding: '1rem 2rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // COMPLETED STATE
  if (testState === 'completed') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <CheckCircle size={40} />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '0 0 1rem 0' }}>Assessment Complete</h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
            Thank you for completing the technical assessment. Your answers have been successfully recorded and securely submitted.
          </p>
          <button 
            onClick={() => navigate('/candidate/dashboard')}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // RUNNING STATE
  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      
      {/* Top Proctoring Header */}
      <header style={{ background: '#1e293b', padding: '1rem 2rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.1rem', color: '#ef4444' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></div>
          <style>{`@keyframes pulse { 0% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { opacity: 0.5; box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }`}</style>
          PROCTORING ACTIVE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft < 60 ? '#ef4444' : '#f8fafc', fontWeight: 700, fontSize: '1.2rem', padding: '0.5rem 1rem', background: '#0f172a', borderRadius: '6px', border: `1px solid ${timeLeft < 60 ? '#ef4444' : '#334155'}` }}>
            <Clock size={20} /> {formatTime(timeLeft)}
          </div>
          <button 
            onClick={handleManualSubmit}
            disabled={submitting}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem' }}>
        
        <div style={{ width: '100%', maxWidth: '800px' }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>
              <span>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#3b82f6', width: `${progress}%`, transition: 'width 0.3s ease' }}></div>
            </div>
          </div>

          {/* Question Card */}
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '3rem', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#f8fafc', marginTop: 0, marginBottom: '2.5rem', lineHeight: '1.5' }}>
              {currentQuestion.question}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [currentQuestion.id]: idx })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '1.25rem',
                      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#0f172a',
                      border: isSelected ? '2px solid #3b82f6' : '2px solid #334155',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? '6px solid #3b82f6' : '2px solid #64748b',
                      marginRight: '1rem',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isSelected && <div style={{width: '10px', height: '10px', background: '#3b82f6', borderRadius: '50%'}}></div>}
                    </div>
                    <span style={{ fontSize: '1.1rem', color: isSelected ? '#eff6ff' : '#cbd5e1', fontWeight: isSelected ? 600 : 400 }}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
              style={{
                padding: '1rem 2rem',
                background: currentQuestionIndex === 0 ? '#0f172a' : '#1e293b',
                color: currentQuestionIndex === 0 ? '#475569' : '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>

            {currentQuestionIndex < QUESTIONS.length - 1 && (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                style={{
                  padding: '1rem 2rem',
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Next <ArrowRight size={18} />
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default CandidateAssessment;
