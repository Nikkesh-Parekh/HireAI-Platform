const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getJobs,
    createJob,
    updateJob,
    toggleJobStatus,
    deleteJob
} = require('../controllers/jobController');

router.route('/')
    .get(getJobs)
    .post(protect, authorize('Admin', 'Recruiter'), createJob);

router.route('/:id/status')
    .put(protect, authorize('Admin', 'Recruiter'), toggleJobStatus);

router.route('/:id')
    .put(protect, authorize('Admin', 'Recruiter'), updateJob)
    .delete(protect, authorize('Admin', 'Recruiter'), deleteJob);

module.exports = router;
