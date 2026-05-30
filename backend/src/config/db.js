const mongoose = require('mongoose');

const seedInMemoryData = async () => {
    try {
        const User = require('../models/User');
        const Candidate = require('../models/Candidate');
        const Job = require('../models/Job');

        // Clean collections just in case
        await User.deleteMany({});
        await Candidate.deleteMany({});
        await Job.deleteMany({});

        const users = [
            { name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'Admin' },
            { name: 'Recruiter User', email: 'recruiter@example.com', password: 'password123', role: 'Recruiter' },
            { name: 'Alice Johnson', email: 'alice.johnson@example.com', password: 'password123', role: 'Candidate' },
            { name: 'Interviewer User', email: 'interviewer@example.com', password: 'password123', role: 'Interviewer' },
        ];
        await User.create(users);
        console.log('In-memory database seeded with default users');

        // Create Candidates
        const candidates = [
            {
                name: "Alice Johnson",
                role: "Frontend Developer",
                status: "applied",
                avatar: "https://ui-avatars.com/api/?name=Alice+Johnson&background=0D8ABC&color=fff",
                match: 92,
                scores: { screening: null, technical: null, interview: null },
                details: {
                    location: "New York, NY",
                    experience: "4 years of experience building scalable web applications. Proficient in React, Redux, and modern CSS. Previously led frontend development at StartupX, increasing page load speed by 40%.",
                    education: "B.S. Computer Science, NYU",
                    skills: ["React", "JavaScript", "CSS", "Redux", "Tailwind"],
                    email: "alice.johnson@example.com",
                    phone: "+1 (555) 123-4567"
                }
            },
            {
                name: "Bob Smith",
                role: "Backend Dev",
                status: "assessment",
                avatar: "https://ui-avatars.com/api/?name=Bob+Smith&background=F472B6&color=fff",
                match: 88,
                scores: { screening: 9, technical: null, interview: null },
                details: {
                    location: "San Francisco, CA",
                    experience: "6 years of experience in Node.js and Python. Architected microservices that handled 100k requests/min. Strong background in database optimization and cloud infrastructure.",
                    education: "M.S. Software Engineering, Stanford",
                    skills: ["Node.js", "Python", "PostgreSQL", "Docker", "AWS"],
                    email: "bob.smith@example.com",
                    phone: "+1 (555) 987-6543"
                }
            },
            {
                name: "Charlie Davis",
                role: "UI/UX Designer",
                status: "interview",
                avatar: "https://ui-avatars.com/api/?name=Charlie+Davis&background=10B981&color=fff",
                match: 95,
                scores: { screening: 10, technical: 85, interview: null },
                details: {
                    location: "Austin, TX",
                    experience: "5 years creating user-centric designs for SaaS platforms. Expert in Figma and wireframing. Reduced user churn by 15% through complete redesign of onboarding flow.",
                    education: "B.F.A. Design, RISD",
                    skills: ["Figma", "User Research", "Prototyping", "UI/UX", "Adobe CC"],
                    email: "charlie.d@example.com",
                    phone: "+1 (555) 456-7890"
                },
                interviewSlot: { date: "2024-06-15", time: "14:00" }
            },
            {
                name: "Diana Prince",
                role: "Product Manager",
                status: "hired",
                avatar: "https://ui-avatars.com/api/?name=Diana+Prince&background=F59E0B&color=fff",
                match: 98,
                scores: { screening: 10, technical: 95, interview: 98 },
                details: {
                    location: "Seattle, WA",
                    experience: "8 years in product management. Launched 3 successful B2B products generating $2M+ ARR. Adept at agile methodologies and cross-functional team leadership.",
                    education: "MBA, Harvard Business School",
                    skills: ["Agile", "Roadmapping", "Jira", "Strategy", "Data Analysis"],
                    email: "diana.prince@example.com",
                    phone: "+1 (555) 234-5678"
                }
            }
        ];
        await Candidate.insertMany(candidates);
        console.log('In-memory database seeded with default candidates');

        // Create Jobs
        const jobs = [
            { title: 'Senior React Developer', department: 'Engineering', location: 'Remote', applicants: 124, status: 'Active', salary: '$120k - $150k', employmentType: 'Full-time', experienceLevel: 'Senior', deadline: '2026-06-30', eligibility: { cgpa: '3.0', skills: 'React, Node.js' }, description: 'Build amazing React apps.' },
            { title: 'Product Manager', department: 'Product', location: 'New York, NY', applicants: 89, status: 'Active', salary: '$130k - $160k', employmentType: 'Full-time', experienceLevel: 'Mid Level', deadline: '2026-05-20', eligibility: { cgpa: '3.2', skills: 'Agile, Jira' }, description: 'Lead our product strategy.' },
            { title: 'UX/UI Designer', department: 'Design', location: 'Remote', applicants: 215, status: 'Closed', salary: '$100k - $130k', employmentType: 'Contract', experienceLevel: 'Mid Level', deadline: '2026-04-15', eligibility: { cgpa: '3.0', skills: 'Figma, Sketch' }, description: 'Design beautiful interfaces.' },
            { title: 'DevOps Engineer', department: 'Engineering', location: 'San Francisco, CA', applicants: 42, status: 'Active', salary: '$140k - $170k', employmentType: 'Full-time', experienceLevel: 'Senior', deadline: '2026-07-01', eligibility: { cgpa: '3.0', skills: 'AWS, Docker' }, description: 'Maintain our cloud infra.' },
        ];
        await Job.insertMany(jobs);
        console.log('In-memory database seeded with default jobs');

    } catch (e) {
        console.error('Error seeding in-memory database:', e);
    }
};

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("Error: MONGO_URI is not defined in .env file.");
            process.exit(1);
        }
        // Set connection timeout to 4 seconds to trigger fallback quickly if blocked
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 4000
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn(`Database Connection Error: ${error.message}`);
        console.log("Falling back to mongodb-memory-server for local validation...");
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            const conn = await mongoose.connect(mongoUri);
            console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
            await seedInMemoryData();
        } catch (memError) {
            console.error(`Failed to start in-memory database: ${memError.message}`);
            process.exit(1);
        }
    }
};

module.exports = connectDB;
