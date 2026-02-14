import React, { useState, useEffect } from 'react';
import Login from './Login.jsx';
import Admin from './Admin.jsx';
import Leaderboard from './Leaderboard.jsx';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
    if (storedUser && storedIsAdmin) {
      setUser(storedUser);
      setIsAdmin(storedIsAdmin);
    }
  }, []);

  const handleLogin = (username, admin) => {
    setUser(username);
    setIsAdmin(admin);
    localStorage.setItem('user', username);
    localStorage.setItem('isAdmin', admin.toString());
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Attendance Tracker</h1>
        {user && <button onClick={handleLogout}>Logout</button>}
      </header>
      {!user ? (
        <>
          <Login onLogin={handleLogin} />
          <Leaderboard />
        </>
      ) : (
        <Admin user={user} />
      )}
    </div>
  );
}

export default App;