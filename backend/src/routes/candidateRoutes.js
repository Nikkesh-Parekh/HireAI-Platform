const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/authMiddleware');

// Multer Config
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, 'resume-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
const {
    getCandidates,
    getCandidateById,
    updateCandidateStatus,
    updateCandidateScores,
    scheduleInterview,
    finalizeDecision,
    applyForJob,
    getMyApplications
} = require('../controllers/candidateController');

router.route('/')
    .get(protect, authorize('Admin', 'Recruiter', 'Interviewer'), getCandidates)
    .post(protect, upload.single('resume'), applyForJob);

router.route('/me')
    .get(protect, getMyApplications);

router.route('/:id')
    .get(protect, authorize('Admin', 'Recruiter', 'Interviewer'), getCandidateById);

router.route('/:id/advance')
    .put(protect, authorize('Admin', 'Recruiter', 'Interviewer'), updateCandidateStatus);

router.route('/:id/score')
    .put(protect, authorize('Admin', 'Recruiter', 'Interviewer'), updateCandidateScores);

router.route('/:id/schedule')
    .put(protect, authorize('Admin', 'Recruiter', 'Interviewer'), scheduleInterview);

router.route('/:id/decision')
    .put(protect, authorize('Admin', 'Recruiter', 'Interviewer'), finalizeDecision);

module.exports = router;
