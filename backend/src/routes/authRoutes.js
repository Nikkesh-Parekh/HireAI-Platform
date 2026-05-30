const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    registerUser, 
    loginUser, 
    getMe, 
    forgotPassword, 
    resetPassword,
    getProfile,
    updateProfile 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Multer Storage config for resume upload in profile
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, 'resume-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('resume'), updateProfile);

module.exports = router;
