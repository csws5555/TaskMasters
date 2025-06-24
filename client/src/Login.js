import React, { useState } from 'react';
require('dotenv').config();
const RENDER_URL=process.env.RENDER_URL;

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Enhanced validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (isRegistering && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (isRegistering) {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');

    const endpoint = isRegistering ? '/register' : '/login';
    
    try {
      const response = await fetch(`${RENDER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      if (isRegistering) {
        setMessage('Registration successful! Please login with your new account.');
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
        setErrors({});
      } else {
        onLogin(data);
      }
    } catch (err) {
      setMessage(err.message || 'An error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with real-time validation
  const handleInputChange = (field, value) => {
    switch (field) {
      case 'username':
        setUsername(value);
        if (errors.username) {
          setErrors(prev => ({ ...prev, username: '' }));
        }
        break;
      case 'password':
        setPassword(value);
        if (errors.password) {
          setErrors(prev => ({ ...prev, password: '' }));
        }
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        if (errors.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
        break;
    }
  };

  // Toggle between login and register
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setErrors({});
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-container">
      <h2>
        {isRegistering ? (
          <>
            <img src="/logo.png" alt="Logo" className="header-logo" />
            Create Account
          </>
        ) : (
          <>
            <img src="/logo.png" alt="Logo" className="header-logo" />
            Welcome Back
          </>
        )}
      </h2>
      
      {message && (
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={`form-group ${errors.username ? 'error' : ''}`}>
          <input 
            type="text"
            placeholder="Username" 
            value={username}
            onChange={e => handleInputChange('username', e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className={`form-group ${errors.password ? 'error' : ''}`}>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Password" 
              value={password}
              onChange={e => handleInputChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '35%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ff9e6d',  // Orange accent from your palette
                fontSize: '20px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                transition: 'all 0.3s ease',
              }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        {isRegistering && (
          <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password" 
              value={confirmPassword}
              onChange={e => handleInputChange('confirmPassword', e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="loading"></span>
              {isRegistering ? 'Creating Account...' : 'Signing In...'}
            </>
          ) : (
            isRegistering ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>

      <p>
        {isRegistering ? 'Already have an account?' : 'Need an account?'}
        <button 
          type="button"
          onClick={toggleMode}
          disabled={loading}
        >
          {isRegistering ? 'Sign In' : 'Create Account'}
        </button>
      </p>

      {isRegistering && (
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'left' }}>
          <strong>Password Requirements:</strong>
          <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
            <li>At least 6 characters long</li>
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Login;