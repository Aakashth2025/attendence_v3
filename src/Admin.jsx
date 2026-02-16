import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const users = ["Aakash", "Adarsh", "Sagar", "Sahil", "Gaurav", "Kavya", "Sravya", "Lolasri", "Manisha", "Akshay", "Shashank", "Chaitanya", "Niharika"];

function Admin({ user }) {
  const today = new Date().toLocaleDateString('en-CA');
  const [date, setDate] = useState(today);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [view, setView] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    if (view === 'mark') {
      loadAttendance(today);
    } else if (view === 'date') {
      loadAttendance(date);
    }
  }, [view, date]);

  const loadAttendance = async (selectedDate) => {
    const response = await fetch(`http://attendence-v3.onrender.com/api/attendance/${selectedDate}`);
    const list = await response.json();
    if (view === 'mark') {
      setSelectedUsers(list);
      setIsAttendanceSaved(list.length > 0);
    } else if (view === 'date') {
      setAttendanceList(list);
      const absent = users.length - list.length;
      setPieData([
        { name: 'Present', value: list.length, color: '#4caf50' },
        { name: 'Absent', value: absent, color: '#f44336' }
      ]);
    }
  };

  const handleCheckboxChange = (username) => {
    if (isAttendanceSaved) {
      setMessage("Attendance is already marked for today.");
      return;
    }
    setSelectedUsers(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  const handleSave = async () => {
    if (isAttendanceSaved) {
      setMessage("Today's attendance has already been saved.");
      return;
    }
    //const response = await fetch(`http://localhost:5000/api/attendance?user=${user}`, {
    const response = await fetch(`http://attendence-v3.onrender.com/api/attendance?user=${user}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, users: selectedUsers })
    });
    const data = await response.json();
    if (data.success) {
      setIsAttendanceSaved(true);
      setMessage('Attendance saved successfully!');
    } else {
      setMessage(data.message);
    }
  };

  const isFutureDate = date > today;

  return (
    <div className="admin">
      <h2>Admin Panel</h2>
      <div className="buttons">
        <button onClick={() => setView('mark')}>Take Today's Attendance</button>
        <button onClick={() => setView('date')}>View Attendance by Date</button>
      </div>
      
      {view === 'mark' && (
        <>
          <h3>Mark Attendance for Today ({today})</h3>
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
          <button onClick={handleSave}>Save Attendance</button>
          {message && <p className="message">{message}</p>}
        </>
      )}
      
      {view === 'date' && (
        <>
          <h3>View Attendance by Date</h3>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <h4>Present on {date}:</h4>
          <ul>
            {isFutureDate ? (
              <li>How can someone be present in future?</li>
            ) : attendanceList.length > 0 ? (
              attendanceList.map(u => <li key={u}>{u}</li>)
            ) : (
              <li>No one was present.</li>
            )}
          </ul>
          {!isFutureDate && (
            <PieChart width={400} height={300}>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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