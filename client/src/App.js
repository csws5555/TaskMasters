import React, { useState } from 'react';
import Login from './Login';
import FriendSystem from './FriendSystem';
import Task from './Task';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'friends'

  // Show message temporarily
  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  };

  // Logout function
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setUser(null);
      setMessage('');
      setActiveTab('tasks');
    }
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="App">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>
          <img src="/logo.png" alt="logo" className="logo" />
          TaskMasters
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: 'black', fontSize: '1.1rem' }}>Welcome, {user.username}!</span>
          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'black',
              border: '1px solid rgba(190, 115, 115, 0.3)',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="nav-tabs" style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        borderBottom: '2px solid #e1e5e9',
        paddingBottom: '10px'
      }}>
        <button 
          onClick={() => setActiveTab('tasks')}
          style={{
            background: activeTab === 'tasks' ? 'linear-gradient(135deg, #d4a5c9 0%, #ff6b6b 100%)' : 'transparent',
            color: activeTab === 'tasks' ? 'white' : '#666',
            border: activeTab === 'tasks' ? 'none' : '2px solid #e1e5e9',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Tasks
        </button>
        <button 
          onClick={() => setActiveTab('friends')}
          style={{
            background: activeTab === 'friends' ? 'linear-gradient(135deg, #d4a5c9 0%, #ff6b6b 100%)' : 'transparent',
            color: activeTab === 'friends' ? 'white' : '#666',
            border: activeTab === 'friends' ? 'none' : '2px solid #e1e5e9',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Friends
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tasks' && (
        <Task user={user} showMessage={showMessage} />
      )}

      {activeTab === 'friends' && (
        <FriendSystem user={user} showMessage={showMessage} />
      )}
    </div>
  );
}

export default App;