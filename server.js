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
  .catch(err => console.error(err));

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  users: [{ type: String }]
});

attendanceSchema.index({ users: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: Boolean
});

const User = mongoose.model('User', userSchema);

// ✅ IST date helper
function getTodayServer() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata'
  });
}

// ✅ Today API
app.get('/api/today', (req, res) => {
  res.json({ date: getTodayServer() });
});

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

// ✅ Save attendance — server controls date
app.post('/api/attendance', async (req, res) => {
  const { users } = req.body;
  const requestingUser = req.query.user;
  const date = getTodayServer();

  const user = await User.findOne({ username: requestingUser });

  if (!user || !user.isAdmin) {
    return res.status(403).json({ success: false });
  }

  await Attendance.findOneAndUpdate(
    { date },
    { users },
    { upsert: true }
  );

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/', () => {
    console.log('Hello from the server!');
});