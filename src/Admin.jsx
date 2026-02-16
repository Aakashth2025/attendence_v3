import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const users = ["Aakash","Adarsh","Sagar","Sahil","Gaurav","Kavya","Sravya","Lolasri","Manisha","Akshay","Shashank","Chaitanya","Niharika"];

function Admin({ user }) {

  const [today, setToday] = useState('');
  const [date, setDate] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [view, setView] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    fetch('https://attendence-v3.onrender.com/api/today')
      .then(res => res.json())
      .then(data => {
        setToday(data.date);
        setDate(data.date);
      });
  }, []);

  useEffect(() => {
    if (!today) return;

    if (view === 'mark') loadAttendance(today);
    if (view === 'date') loadAttendance(date);

  }, [view, date, today]);

  const loadAttendance = async (d) => {
    const res = await fetch(`https://attendence-v3.onrender.com/api/attendance/${d}`);
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

  const handleCheckboxChange = (u) => {
    if (isAttendanceSaved) {
      setMessage("Attendance is already marked for today.");
      return;
    }

    setSelectedUsers(prev =>
      prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
    );
  };

  const handleSave = async () => {
    if (isAttendanceSaved) {
      setMessage("Today's attendance has already been saved.");
      return;
    }

    const res = await fetch(`https://attendence-v3.onrender.com/api/attendance?user=${user}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: selectedUsers })
    });

    const data = await res.json();

    if (data.success) {
      setMessage('Attendance saved successfully!');
      loadAttendance(today);
    }
  };

  const isFutureDate = today && date > today;

  /*return (
    <div>
      <h2>Admin Panel</h2>

      <button onClick={() => setView('mark')}>Take Today's Attendance</button>
      <button onClick={() => setView('date')}>View Attendance by Date</button>

      {view === 'mark' && (
        <>
          <h3>Mark Attendance ({today})</h3>

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
          {message && <p>{message}</p>}
        </>
      )}

      {view === 'date' && (
        <>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />

          {isFutureDate ? (
            <p>How can someone be present in future?</p>
          ) : (
            <>
              <ul>
                {attendanceList.map(u => <li key={u}>{u}</li>)}
              </ul>

              <PieChart width={400} height={300}>
                <Pie data={pieData} dataKey="value" outerRadius={80}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </>
          )}
        </>
      )}
    </div>
  );*/
  return (
  <div className="admin">

    <h2>Admin Panel</h2>

    <div className="buttons">
      <button onClick={() => setView('mark')}>Take Today's Attendance</button>
      <button onClick={() => setView('date')}>View Attendance by Date</button>
    </div>

    {view === 'mark' && (
      <>
        <h3>Mark Attendance ({today})</h3>

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
          className="dropdown"
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        <ul>
          {attendanceList.map(u => <li key={u}>{u}</li>)}
        </ul>
      </>
    )}

  </div>
);

}

export default Admin;
