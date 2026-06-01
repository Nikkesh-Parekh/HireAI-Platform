const User = require('../models/User');
const Candidate = require('../models/Candidate');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url (pointing to the frontend router: /reset-password/:token)
        const resetUrl = `${req.protocol}://localhost:5173/reset-password/${resetToken}`;

        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <p><a href="${resetUrl}" clicktracking="off">${resetUrl}</a></p>
            <p>This link will expire in 10 minutes.</p>
        `;

        const emailResult = await sendEmail(user.email, 'Password Reset Token', message);

        if (emailResult.success) {
            res.status(200).json({ message: 'Email sent successfully', previewUrl: emailResult.previewUrl });
        } else {
            // Render Free Tier blocks SMTP outbound port 587. Keep token active and return URL as preview fallback for testing/validation.
            res.status(200).json({ 
                message: 'Password reset link generated! (SMTP is blocked on Render free tier, copy the link below)', 
                previewUrl: resetUrl 
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let profileData = {
            phone: user.profile?.phone || '',
            location: user.profile?.location || '',
            experience: user.profile?.experience || '',
            education: user.profile?.education || '',
            skills: user.profile?.skills || [],
            resumeUrl: user.profile?.resumeUrl || '',
            resumeName: user.profile?.resumeName || ''
        };

        // If profile details are empty, try to pre-fill from the latest application
        if (!profileData.phone || !profileData.location || !profileData.experience || !profileData.education || !profileData.resumeUrl) {
            const latestApp = await Candidate.findOne({ 'details.email': user.email }).sort({ createdAt: -1 });
            if (latestApp && latestApp.details) {
                if (!profileData.phone) profileData.phone = latestApp.details.phone || '';
                if (!profileData.location) profileData.location = latestApp.details.location || '';
                if (!profileData.experience) profileData.experience = latestApp.details.experience || '';
                if (!profileData.education) profileData.education = latestApp.details.education || '';
                if (!profileData.skills.length) profileData.skills = latestApp.details.skills || [];
                if (!profileData.resumeUrl) {
                    profileData.resumeUrl = latestApp.details.resumeUrl || '';
                    if (profileData.resumeUrl) {
                        const urlParts = profileData.resumeUrl.split('/');
                        profileData.resumeName = urlParts[urlParts.length - 1];
                    }
                }
            }
        }

        res.status(200).json({ success: true, data: profileData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { phone, location, experience, education, skills } = req.body;

        // Initialize profile if it doesn't exist
        if (!user.profile) {
            user.profile = {};
        }

        if (phone !== undefined) user.profile.phone = phone;
        if (location !== undefined) user.profile.location = location;
        if (experience !== undefined) user.profile.experience = experience;
        if (education !== undefined) user.profile.education = education;

        if (skills !== undefined) {
            let parsedSkills = [];
            if (typeof skills === 'string') {
                parsedSkills = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
            } else if (Array.isArray(skills)) {
                parsedSkills = skills;
            }
            user.profile.skills = parsedSkills;
        }

        if (req.file) {
            user.profile.resumeUrl = `http://localhost:5000/uploads/${req.file.filename}`;
            user.profile.resumeName = req.file.originalname;
        }

        await user.save();

        res.status(200).json({ success: true, data: user.profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

