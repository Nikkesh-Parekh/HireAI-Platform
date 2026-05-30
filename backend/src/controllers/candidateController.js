const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const { sendEmail } = require('../utils/mailer');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public (for now)
exports.getCandidates = async (req, res) => {
    try {
        const candidates = await Candidate.find({});
        res.status(200).json({ success: true, data: candidates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single candidate by ID
// @route   GET /api/candidates/:id
// @access  Private (Admin, Recruiter, Interviewer)
exports.getCandidateById = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        res.status(200).json({ success: true, data: candidate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update candidate status (advance/reject)
// @route   PUT /api/candidates/:id/advance
// @access  Public (for now)
exports.updateCandidateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['applied', 'assessment', 'interview', 'hired', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        res.status(200).json({ success: true, data: candidate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update candidate scores
// @route   PUT /api/candidates/:id/score
// @access  Public (for now)
exports.updateCandidateScores = async (req, res) => {
    try {
        const { screening, technical, interview } = req.body;

        const candidate = await Candidate.findById(req.params.id);
        
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        // Update only provided scores
        if (screening !== undefined) candidate.scores.screening = screening;
        if (technical !== undefined) candidate.scores.technical = technical;
        if (interview !== undefined) candidate.scores.interview = interview;

        await candidate.save();

        res.status(200).json({ success: true, data: candidate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Schedule interview
// @route   PUT /api/candidates/:id/schedule
// @access  Public (for now)
exports.scheduleInterview = async (req, res) => {
    try {
        const { date, startTime, endTime } = req.body;

        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { interviewSlot: { date, startTime, endTime } },
            { new: true, runValidators: true }
        );

        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        res.status(200).json({ success: true, data: candidate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Finalize Interview Decision (Accept/Reject)
// @route   PUT /api/candidates/:id/decision
// @access  Public
exports.finalizeDecision = async (req, res) => {
    try {
        const { decision } = req.body; // 'accept' or 'reject'
        const candidate = await Candidate.findById(req.params.id);

        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        let newStatus;
        let emailSubject;
        let emailHtml;

        if (decision === 'accept') {
            newStatus = 'hired';
            emailSubject = `Job Offer: ${candidate.role} at HireAI`;
            emailHtml = `
                <h3>Congratulations, ${candidate.name}!</h3>
                <p>We were incredibly impressed by your performance during the live interview.</p>
                <p>We would like to formally offer you the position of <strong>${candidate.role}</strong>.</p>
                <p>Our HR team will follow up shortly with the official offer letter and next steps.</p>
                <br/>
                <p>Welcome to the team!</p>
                <p>- HireAI Admin</p>
            `;
        } else if (decision === 'reject') {
            newStatus = 'interview'; // keeping them in interview stage but could be 'rejected'
            emailSubject = `Update regarding your application for ${candidate.role}`;
            emailHtml = `
                <h3>Hi ${candidate.name},</h3>
                <p>Thank you for taking the time to interview with us for the <strong>${candidate.role}</strong> position.</p>
                <p>While we enjoyed getting to know you, we have decided to move forward with other candidates whose experience better aligns with our current needs.</p>
                <p>We wish you the best of luck in your future endeavors.</p>
                <br/>
                <p>- HireAI Admin</p>
            `;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid decision' });
        }

        // Update candidate status
        if(decision === 'accept') {
           candidate.status = newStatus;
        } else {
           candidate.status = 'rejected'; 
        }
        await candidate.save();

        // Send Email using Nodemailer
        const emailResult = await sendEmail(candidate.email, emailSubject, emailHtml);

        res.status(200).json({ 
            success: true, 
            data: candidate,
            emailSent: emailResult.success,
            previewUrl: emailResult.previewUrl 
        });

    } catch (error) {
        console.error("Finalize Decision Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Candidate applies for a job
// @route   POST /api/candidates
// @access  Private (Candidate)
exports.applyForJob = async (req, res) => {
    try {
        const { role, location, experience, education, skills, phone, resumeUrl: bodyResumeUrl } = req.body;
        
        let resumeUrl = '';
        if (req.file) {
            // Store the path so the frontend can fetch it statically
            resumeUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        } else if (bodyResumeUrl) {
            resumeUrl = bodyResumeUrl;
        }

        // The user's email and name come from the authenticated JWT token
        const email = req.user.email;
        const name = req.user.name;

        // Parse skills if sent as a comma separated string
        let parsedSkills = [];
        if (skills) {
            parsedSkills = typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : skills;
        }

        // --- Simulated AI Resume Match Engine ---
        let matchScore = 75; // Default base score
        try {
            const job = await Job.findOne({ title: role });
            if (job) {
                const requiredSkills = job.eligibility?.skills 
                    ? job.eligibility.skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) 
                    : [];
                
                if (requiredSkills.length > 0) {
                    const candidateSkills = parsedSkills.map(s => s.toLowerCase());
                    const matchingSkills = requiredSkills.filter(s => candidateSkills.includes(s));
                    const matchRatio = matchingSkills.length / requiredSkills.length;
                    
                    // Match score: 70% base + up to 26% based on skills match + 1-4% randomized parser factor
                    matchScore = Math.round(70 + (matchRatio * 26) + (Math.random() * 3 + 1));
                } else {
                    matchScore = Math.round(80 + (Math.random() * 15));
                }
            } else {
                matchScore = Math.round(75 + (Math.random() * 20));
            }
        } catch (dbErr) {
            console.error("AI Match score calculation error:", dbErr);
            matchScore = Math.round(75 + (Math.random() * 20));
        }
        matchScore = Math.min(matchScore, 100);

        const candidate = await Candidate.create({
            name,
            role,
            status: 'applied',
            match: matchScore,
            details: {
                location,
                experience,
                education,
                skills: parsedSkills,
                email,
                phone,
                resumeUrl
            }
        });

        res.status(201).json({ success: true, data: candidate });
    } catch (error) {
        console.error("Apply For Job Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get applications for logged in candidate
// @route   GET /api/candidates/me
// @access  Private (Candidate)
exports.getMyApplications = async (req, res) => {
    try {
        const candidates = await Candidate.find({ 'details.email': req.user.email }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: candidates });
    } catch (error) {
        console.error("Get My Applications Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
