const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['applied', 'assessment', 'interview', 'hired', 'rejected'],
        default: 'applied',
    },
    avatar: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=Candidate&background=random',
    },
    match: {
        type: Number,
        default: 0,
    },
    scores: {
        screening: { type: Number, default: null },
        technical: { type: Number, default: null },
        interview: { type: Number, default: null },
    },
    details: {
        location: { type: String },
        experience: { type: String },
        education: { type: String },
        skills: [{ type: String }],
        email: { type: String },
        phone: { type: String },
        resumeUrl: { type: String },
    },
    interviewSlot: {
        date: { type: String, default: null },
        startTime: { type: String, default: null },
        endTime: { type: String, default: null }
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Candidate', CandidateSchema);
