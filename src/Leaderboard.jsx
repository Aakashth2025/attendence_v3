import React, { useState, useEffect } from 'react';

function Leaderboard() {
  const [studentTotals, setStudentTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/analytics');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.studentTotals) {
          setStudentTotals(data.studentTotals.sort((a, b) => b.total - a.total));
        } else {
          throw new Error('No studentTotals in response');
        }
      } catch (err) {
        setError('Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchTotals();
  }, []);

  if (loading) return <p>Loading leaderboard...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="leaderboard">
      <h2>Attendance Leaderboard</h2>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Student</th>
            <th>Total Days</th>
          </tr>
        </thead>
        <tbody>
          {studentTotals.map((student, index) => (
            <tr key={student.name}>
              <td>{index + 1}</td>
              <td>{student.name}</td>
              <td>{student.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;