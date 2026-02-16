import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

const attendanceSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    users: [{ type: String }]
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
    // totalDays field removed
});
const User = mongoose.model('User', userSchema);

async function seedUsers() {
    const users = [
        { username: "Aakash", password: "pX8kL2mN" },
        { username: "Adarsh", password: "qY9mN3oP" },
        { username: "Sagar", password: "rZ0nO4pQ" },
        { username: "Sahil", password: "sA1oP5qR" },
        { username: "Gaurav", password: "tB2pQ6rS" },
        { username: "Kavya", password: "uC3qR7sT" },
        { username: "Sravya", password: "vD4rS8tU" },
        { username: "Lolasri", password: "wE5sT9uV" },
        { username: "Manisha", password: "xF6tU0vW" },
        { username: "Akshay", password: "yG7uV1wX" },
        { username: "Shashank", password: "zH8vW2xY" },
        { username: "Chaitanya", password: "aI9wX3yZ" },
        { username: "Niharika", password: "bJ0xY4zA" },
        { username: "admin", password: "admin123", isAdmin: true }
        // totalDays removed from seeding
    ];
    for (const user of users) {
        try {
            await User.findOneAndUpdate({ username: user.username }, user, { upsert: true });
        } catch (err) {
            console.error('Error seeding user:', err);
        }
    }
}
seedUsers();

function getTodayServer() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            res.json({ success: true, user: username, isAdmin: user.isAdmin });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/attendance/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const record = await Attendance.findOne({ date });
        const list = record ? record.users : [];
        res.json(list);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.post('/api/attendance', async (req, res) => {
    const { date, users } = req.body;
    const requestingUser = req.query.user;
    const todayServer = getTodayServer();
    if (date !== todayServer) {
        return res.json({ success: false, message: 'Attendance can only be marked for today.' });
    }
    try {
        const user = await User.findOne({ username: requestingUser });
        if (!user || !user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        await Attendance.findOneAndUpdate(
            { date },
            { users },
            { upsert: true }
        );
        // totalDays increment removed
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/attendance/user/:user', async (req, res) => {
    const { user } = req.params;
    const requestingUser = req.query.user;
    try {
        const requester = await User.findOne({ username: requestingUser });
        if (!requester || (!requester.isAdmin && requestingUser !== user)) {
            return res.status(403).json({ totalDays: 0, dates: [], message: 'Access denied' });
        }
        const records = await Attendance.find({ users: user });
        const dates = records.map(record => record.date);
        res.json({ totalDays: records.length, dates });
    } catch (err) {
        res.status(500).json({ totalDays: 0, dates: [] });
    }
});

app.get('/api/analytics', async (req, res) => {
    console.log('API /api/analytics called');  // For debugging
    try {
        // Daily percentages for last 30 days
        const dailyPercentages = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const record = await Attendance.findOne({ date: dateStr });
            const present = record ? record.users.length : 0;
            const total = 13; // Number of students
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
            dailyPercentages.push({ date: dateStr, percentage });
        }

        // Student totals
        const studentTotals = [];
        const studentList = ["Aakash", "Adarsh", "Sagar", "Sahil", "Gaurav", "Kavya", "Sravya", "Lolasri", "Manisha", "Akshay", "Shashank", "Chaitanya", "Niharika"];
        for (const u of studentList) {
            const records = await Attendance.find({ users: u });
            studentTotals.push({ name: u, total: records.length });
        }

        // Monthly summary
        const monthlySummary = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toISOString().slice(0, 7);
            const records = await Attendance.find({ date: { $regex: `^${month}` } });
            const totalDays = records.length;
            monthlySummary.push({ month, total: totalDays });
        }

        res.json({ dailyPercentages, studentTotals, monthlySummary });
    } catch (err) {
        console.error('Error in /api/analytics:', err);
        res.status(500).json([]);
    }
});

app.get('/', (req, res) => {
    res.send('Attendance Tracker Backend is running!');
});

app.get('/test', (req, res) => {
    console.log('Test route called');  // Should log
    res.json({ message: 'Test successful' });
});

/*app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});*/
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
