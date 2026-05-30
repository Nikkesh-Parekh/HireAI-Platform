const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    salary: {
        type: String,
    },
    applicants: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Active', 'Closed'],
        default: 'Active',
    },
    eligibility: {
        cgpa: { type: String },
        skills: { type: String },
    },
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        default: 'Full-time',
    },
    experienceLevel: {
        type: String,
        enum: ['Entry Level', 'Mid Level', 'Senior', 'Executive'],
        default: 'Mid Level',
    },
    deadline: {
        type: String, // Store as string (e.g. YYYY-MM-DD) for simplicity
        default: null,
    },
    description: {
        type: String,
    }
}, {
    timestamps: true, // This will handle the 'posted' logic natively via createdAt
});

module.exports = mongoose.model('Job', JobSchema);
