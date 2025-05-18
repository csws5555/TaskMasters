import React, { useState } from 'react';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
  
// login handling
const handleSubmit = () => {
  // Add client-side validation
  if (!username.trim() || !password.trim()) {
    alert('Username and password are required');
    return;
  }

  if (username.length < 3) {
    alert('Username must be at least 3 characters');
    return;
  }

  if (password.length < 4) {
    alert('Password must be at least 4 characters');
    return;
  }

  const endpoint = isRegistering ? '/register' : '/login';
  
  fetch(`http://localhost:5000${endpoint}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json' // Explicitly request JSON
    },
    body: JSON.stringify({ username, password }),
  })
  .then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  })
  .then(data => {
    if (isRegistering) {
      alert('Registration successful! Please login');
      setIsRegistering(false);
    } else {
      onLogin(data);
    }
  })
  .catch(err => {
    alert(err.message || 'An error occurred');
    console.error('Auth error:', err);
  });
};
  
    return (
      <div className="login-container">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        <input 
          placeholder="Username" 
          value={username}
          onChange={e => setUsername(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
        />
        <button onClick={handleSubmit}>
          {isRegistering ? 'Register' : 'Login'}
        </button>
        <p>
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    );
}

export default Login;
  