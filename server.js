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

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

const attendanceSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    users: [{ type: String }]
});

// 🔥 Index for faster queries
attendanceSchema.index({ users: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
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
    ];

    for (const user of users) {
        await User.findOneAndUpdate({ username: user.username }, user, { upsert: true });
    }
}
seedUsers();

// ✅ IST timezone fix
function getTodayServer() {
    return new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata'
    });
}

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        res.json({ success: true, user: username, isAdmin: user.isAdmin });
    } else {
        res.json({ success: false, message: 'Invalid credentials' });
    }
});

app.get('/api/attendance/:date', async (req, res) => {
    const record = await Attendance.findOne({ date: req.params.date });
    res.json(record ? record.users : []);
});

app.post('/api/attendance', async (req, res) => {
    const { date, users } = req.body;
    const requestingUser = req.query.user;
    const todayServer = getTodayServer();

    if (date !== todayServer) {
        return res.json({ success: false, message: 'Attendance can only be marked for today.' });
    }

    const user = await User.findOne({ username: requestingUser });
    if (!user || !user.isAdmin) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    await Attendance.findOneAndUpdate({ date }, { users }, { upsert: true });
    res.json({ success: true });
});

app.get('/api/attendance/user/:user', async (req, res) => {
    const requestingUser = req.query.user;
    const requester = await User.findOne({ username: requestingUser });

    if (!requester || (!requester.isAdmin && requestingUser !== req.params.user)) {
        return res.status(403).json({ totalDays: 0, dates: [] });
    }

    const records = await Attendance.find({ users: req.params.user });
    res.json({
        totalDays: records.length,
        dates: records.map(r => r.date)
    });
});

// 🚀 Optimized analytics
app.get('/api/analytics', async (req, res) => {
    try {

        // Parallel daily queries
        const dailyPercentages = await Promise.all(
            Array.from({ length: 30 }, (_, idx) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - idx));
                const dateStr = date.toISOString().split('T')[0];

                return Attendance.findOne({ date: dateStr }).then(record => {
                    const present = record ? record.users.length : 0;
                    const total = 13;
                    const percentage = total ? Math.round((present / total) * 100) : 0;
                    return { date: dateStr, percentage };
                });
            })
        );

        // 🔥 Aggregation instead of loop
        const studentTotals = await Attendance.aggregate([
            { $unwind: "$users" },
            {
                $group: {
                    _id: "$users",
                    total: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: "$_id",
                    total: 1,
                    _id: 0
                }
            }
        ]);

        // Monthly summary parallel
        const monthlySummary = await Promise.all(
            Array.from({ length: 12 }, (_, idx) => {
                const date = new Date();
                date.setMonth(date.getMonth() - (11 - idx));
                const month = date.toISOString().slice(0, 7);

                return Attendance.find({ date: { $regex: `^${month}` } })
                    .then(records => ({ month, total: records.length }));
            })
        );

        res.json({ dailyPercentages, studentTotals, monthlySummary });

    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

app.get('/', (req, res) => {
    res.send('Attendance Tracker Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
