import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Mail, Phone, MapPin, Award, BookOpen, Clock, FileText, AlertCircle, Edit, Save, X, Plus, Upload } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './CandidateProfilePage.css';

const CandidateProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState({
    phone: '',
    location: '',
    experience: '',
    education: '',
    skills: [],
    resumeUrl: '',
    resumeName: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    phone: '',
    location: '',
    experience: '',
    education: '',
    skills: []
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [newSkill, setNewSkill] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchProfileAndApplications();
  }, []);

  const fetchProfileAndApplications = async () => {
    try {
      const [appsRes, profileRes] = await Promise.all([
        axios.get('http://localhost:5000/api/candidates/me'),
        axios.get('http://localhost:5000/api/auth/profile').catch(() => null)
      ]);

      if (appsRes.data.success) {
        setApplications(appsRes.data.data);
      }

      if (profileRes && profileRes.data && profileRes.data.success) {
        const profData = profileRes.data.data;
        const mappedProfile = {
          phone: profData.phone || '',
          location: profData.location || '',
          experience: profData.experience || '',
          education: profData.education || '',
          skills: profData.skills || [],
          resumeUrl: profData.resumeUrl || '',
          resumeName: profData.resumeName || ''
        };
        setProfile(mappedProfile);
        setFormData(mappedProfile);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load profile details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    setFormData({
      phone: profile.phone || '',
      location: profile.location || '',
      experience: profile.experience || '',
      education: profile.education || '',
      skills: [...(profile.skills || [])]
    });
    setResumeFile(null);
    setNewSkill('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setResumeFile(null);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, trimmed]
      });
      setNewSkill('');
    }
  };

  const handleKeyDownSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill(e);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove)
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setResumeFile(file);
      } else {
        showToast("Please upload PDF files only.", "error");
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setResumeFile(file);
      } else {
        showToast("Please upload PDF files only.", "error");
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const submitData = new FormData();
    submitData.append('phone', formData.phone);
    submitData.append('location', formData.location);
    submitData.append('experience', formData.experience);
    submitData.append('education', formData.education);
    submitData.append('skills', formData.skills.join(','));

    if (resumeFile) {
      submitData.append('resume', resumeFile);
    }

    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        showToast('Profile updated successfully!', 'success');
        const profData = res.data.data;
        const updatedProfile = {
          phone: profData.phone || '',
          location: profData.location || '',
          experience: profData.experience || '',
          education: profData.education || '',
          skills: profData.skills || [],
          resumeUrl: profData.resumeUrl || '',
          resumeName: profData.resumeName || ''
        };
        setProfile(updatedProfile);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page-container">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>My Profile</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Review and manage your skills, education, and job application history.</p>
        </div>
        {!isEditing && !loading && (
          <button onClick={handleStartEdit} className="edit-profile-btn">
            <Edit size={16} /> Edit Profile
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <span>Loading profile information...</span>
        </div>
      ) : (
        <div className="profile-grid">
          {/* Left card - Basic Info */}
          <div className="profile-card-left">
            <div className="profile-avatar-large">
              {user?.name?.charAt(0) || 'C'}
            </div>
            <h2>{user?.name}</h2>
            <div className="profile-role-tag">Candidate User</div>
            
            <div className="profile-details-list">
              <div>
                <div className="detail-item-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Email Address</span>
                </div>
                <div className="detail-item-value">{user?.email}</div>
              </div>
              
              <div>
                <div className="detail-item-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Phone Number</span>
                </div>
                <div className="detail-item-value">
                  {profile.phone || 'Not provided'}
                </div>
              </div>
              
              <div>
                <div className="detail-item-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Location</span>
                </div>
                <div className="detail-item-value">
                  {profile.location || 'Not provided'}
                </div>
              </div>

              {profile.resumeUrl && (
                <div style={{ marginTop: '12px' }}>
                  <a 
                    href={profile.resumeUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="detail-item-value"
                    style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                  >
                    <FileText size={16} /> {profile.resumeName || 'View Current Resume'}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right card - Details and Applications / Forms */}
          <div className="profile-card-right">
            {isEditing ? (
              <form onSubmit={handleFormSubmit} className="profile-section-card glass-form">
                <h3>Edit Profile Details</h3>
                
                <div className="form-row-two">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +1 555 123 4567" 
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. San Francisco, CA" 
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Professional Experience (Summary)</label>
                  <textarea 
                    placeholder="Briefly describe your years of experience, key achievements, and primary responsibilities..."
                    value={formData.experience}
                    onChange={e => setFormData({ ...formData, experience: e.target.value })}
                    className="form-textarea"
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Education Background</label>
                  <textarea 
                    placeholder="List your degree, major, university, and year of graduation..."
                    value={formData.education}
                    onChange={e => setFormData({ ...formData, education: e.target.value })}
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                {/* Technical Skills Tag Input */}
                <div className="form-group">
                  <label className="form-label">Technical Skills (Press Enter or comma to add)</label>
                  <div className="skills-tag-input-container">
                    <div className="skills-input-wrapper">
                      {formData.skills.map((skill, index) => (
                        <span key={index} className="skill-tag-editable">
                          {skill}
                          <button type="button" onClick={() => handleRemoveSkill(skill)} className="remove-skill-btn">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input 
                        type="text"
                        placeholder={formData.skills.length === 0 ? "Type skill and press Enter" : ""}
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={handleKeyDownSkill}
                        className="skills-inner-input"
                      />
                    </div>
                    <button type="button" onClick={handleAddSkill} className="add-skill-bubble-btn">
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>

                {/* Resume Upload Drag & Drop Zone */}
                <div className="form-group">
                  <label className="form-label">Global Resume (PDF format)</label>
                  <div 
                    className={`resume-drop-zone ${dragActive ? 'active' : ''} ${resumeFile ? 'selected' : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload size={36} className="upload-icon" />
                    {resumeFile ? (
                      <div>
                        <p className="file-name-notice">Selected: {resumeFile.name}</p>
                        <button type="button" onClick={() => setResumeFile(null)} className="clear-file-btn">
                          Change file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="upload-instructions">Drag and drop your PDF resume here, or <span>browse files</span></p>
                        <input 
                          type="file" 
                          accept=".pdf" 
                          id="file-upload-input"
                          onChange={handleFileChange}
                          className="file-hidden-input"
                        />
                        <label htmlFor="file-upload-input" className="file-browse-label">Choose File</label>
                        {profile.resumeName && (
                          <p className="existing-file-info">Currently saved: {profile.resumeName}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions-group">
                  <button type="button" onClick={handleCancelEdit} disabled={submitting} className="cancel-btn">
                    <X size={16} /> Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="save-btn">
                    {submitting ? (
                      'Saving Changes...'
                    ) : (
                      <><Save size={16} /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Experience & Education */}
                <div className="profile-section-card">
                  <h3>Professional Summary</h3>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={18} /> Experience Summary
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {profile.experience || 'No experience summary found. Click "Edit Profile" to write your professional summary!'}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={18} /> Education Background
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {profile.education || 'No education details found. Click "Edit Profile" to write your education background.'}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                <div className="profile-section-card">
                  <h3>Technical Skills</h3>
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="skills-container">
                      {profile.skills.map((skill, index) => (
                        <div key={index} className="skill-bubble">{skill}</div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>No skills added yet.</p>
                  )}
                </div>

                {/* Application List */}
                <div className="profile-section-card">
                  <h3>My Applications ({applications.length})</h3>
                  {applications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                      <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0 }}>You haven't applied for any jobs yet.</p>
                    </div>
                  ) : (
                    <div className="apps-table-container">
                      <table className="apps-table">
                        <thead>
                          <tr>
                            <th>Job Title</th>
                            <th>Applied Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map(app => (
                            <tr key={app._id}>
                              <td style={{ fontWeight: 600 }}>{app.role}</td>
                              <td>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Clock size={14} /> {new Date(app.createdAt).toLocaleDateString()}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge ${app.status}`}>
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateProfilePage;
