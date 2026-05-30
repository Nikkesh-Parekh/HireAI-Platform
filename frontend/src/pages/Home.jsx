import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Users, Cpu } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="badge">AI-Powered Recruitment</div>
          <h1 className="hero-title">
            Hire the <span className="highlight">Top 1%</span><br />
            With Intelligent Automation
          </h1>
          <p className="hero-subtitle">
            The all-in-one ecosystem for job management, real-time technical evaluations, live interviews, and AI-assisted candidate matching.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary btn-lg">
              Start Hiring <ArrowRight size={20} />
            </Link>
            <Link to="/jobs" className="btn btn-ghost btn-lg">
              Find Jobs
            </Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="glass-card main-card">
            <div className="card-header">
              <div className="dots">
                <span></span><span></span><span></span>
              </div>
              <p>Candidate Evaluation</p>
            </div>
            <div className="card-body">
              <div className="stat-row">
                <div className="stat-icon"><Cpu size={24} /></div>
                <div className="stat-details">
                  <h4>AI Resume Match</h4>
                  <div className="progress-bar"><div className="fill" style={{width: '92%'}}></div></div>
                </div>
                <span className="stat-value">92%</span>
              </div>
              <div className="stat-row">
                <div className="stat-icon"><Code size={24} /></div>
                <div className="stat-details">
                  <h4>Coding Assessment</h4>
                  <div className="progress-bar"><div className="fill" style={{width: '88%'}}></div></div>
                </div>
                <span className="stat-value">88/100</span>
              </div>
              <div className="stat-row">
                <div className="stat-icon"><Users size={24} /></div>
                <div className="stat-details">
                  <h4>Interview Rating</h4>
                  <div className="progress-bar"><div className="fill" style={{width: '95%'}}></div></div>
                </div>
                <span className="stat-value">Excellent</span>
              </div>
            </div>
          </div>
          
          <div className="floating-element blob-1"></div>
          <div className="floating-element blob-2"></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
