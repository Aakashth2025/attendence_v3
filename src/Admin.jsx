import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const API = "https://attendence-v3.onrender.com";

const users = ["Aakash","Adarsh","Sagar","Sahil","Gaurav","Kavya","Sravya","Lolasri","Manisha","Akshay","Shashank","Chaitanya","Niharika"];

function Admin({ user }) {

  const [date, setDate] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [view, setView] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [message, setMessage] = useState('');
  const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);
  const [pieData, setPieData] = useState([]);

  // ✅ Fetch server date
  useEffect(() => {
    fetch(`${API}/api/today`)
      .then(res => res.json())
      .then(data => setDate(data.date));
  }, []);

  useEffect(() => {
    if (!date) return;

    if (view === 'mark') {
      loadAttendance(date);
    } else if (view === 'date') {
      loadAttendance(date);
    }
  }, [view, date]);

  const loadAttendance = async (selectedDate) => {
    const res = await fetch(`${API}/api/attendance/${selectedDate}`);
    const list = await res.json();

    if (view === 'mark') {
      setSelectedUsers(list);
      setIsAttendanceSaved(list.length > 0);
    } else {
      setAttendanceList(list);
      const absent = users.length - list.length;

      setPieData([
        { name: 'Present', value: list.length, color: '#4caf50' },
        { name: 'Absent', value: absent, color: '#f44336' }
      ]);
    }
  };

  const handleCheckboxChange = (username) => {
    if (isAttendanceSaved) return;

    setSelectedUsers(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  const handleSave = async () => {
    const res = await fetch(`${API}/api/attendance?user=${user}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: selectedUsers })
    });

    const data = await res.json();

    if (data.success) {
      setIsAttendanceSaved(true);
      setMessage("Attendance saved");
    }
  };

  const isFutureDate = date > new Date().toISOString().split('T')[0];

  return (
    <div className="admin">
      <h2>Admin Panel</h2>

      <button onClick={() => setView('mark')}>Take Today's Attendance</button>
      <button onClick={() => setView('date')}>View Attendance by Date</button>

      {view === 'mark' && (
        <>
          <h3>Mark Attendance ({date})</h3>

          {users.map(u => (
            <label key={u}>
              <input
                type="checkbox"
                checked={selectedUsers.includes(u)}
                onChange={() => handleCheckboxChange(u)}
                disabled={isAttendanceSaved}
              />
              {u}
            </label>
          ))}

          <button onClick={handleSave}>Save</button>
          {message && <p>{message}</p>}
        </>
      )}

      {view === 'date' && (
        <>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <ul>
            {isFutureDate
              ? <li>Future date</li>
              : attendanceList.map(u => <li key={u}>{u}</li>)
            }
          </ul>

          {!isFutureDate && (
            <PieChart width={400} height={300}>
              <Pie data={pieData} dataKey="value" outerRadius={80}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </>
      )}
    </div>
  );
}

export default Admin;
