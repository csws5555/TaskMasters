import React, { useState } from 'react';
import './FriendRequests.css';
import PropTypes from 'prop-types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000'; 
console.log('API URL (Task):', API_URL);

FriendRequests.propTypes = {
  user: PropTypes.object.isRequired,
  friendRequests: PropTypes.array.isRequired,
  pendingRequests: PropTypes.array.isRequired,
  onSendFriendRequest: PropTypes.func.isRequired,
  onAcceptFriendRequest: PropTypes.func.isRequired,
  onDeclineFriendRequest: PropTypes.func.isRequired,
  showMessage: PropTypes.func.isRequired,
  loadFriendRequests: PropTypes.func.isRequired // Add this
};

function FriendRequests({ 
  user, 
  friendRequests, 
  pendingRequests, 
  onSendFriendRequest, 
  onAcceptFriendRequest, 
  onDeclineFriendRequest,
  showMessage,
  loadFriendRequests
}) {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for users by username
const handleSearch = async (e) => {
  e.preventDefault();
  if (!searchInput.trim()) return;

  setIsSearching(true);
  try {
    const response = await fetch(
    `${API_URL}/users/search/${encodeURIComponent(searchInput)}?currentUserId=${user.id}`
  );
    
    // First check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    if (response.ok) {
      setSearchResults(data);
    } else {
      throw new Error(data.error || 'Error searching users');
    }
  } catch (error) {
    console.error('Search error:', error);
    showMessage(error.message, 'error');
    setSearchResults([]);
  } finally {
    setIsSearching(false);
  }
};

// Send friend request
const handleSendFriendRequest = async (username) => {
  try {
    await onSendFriendRequest(username);
    setSearchInput('');
    setSearchResults([]);
    showMessage(`Friend request sent to ${username}!`, 'success');
    
    // Wait a moment before refreshing to ensure server processed the request
    await new Promise(resolve => setTimeout(resolve, 300));
    await loadFriendRequests();
  } catch (error) {
    console.error("Failed to send request:", error);
    showMessage(error.message || 'Failed to send friend request', 'error');
  }
};


  return (
    <div className="friend-requests-container">
      {/* Search and Send Friend Request Section */}
      <div className="send-request-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">🔍</span>
            Find Friends
          </h3>
          <p className="section-subtitle">Search by username to connect with friends</p>
        </div>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter username..."
              className="username-input"
              required
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results">
            <h4 className="results-title">Search Results</h4>
            <div className="results-list">
              {searchResults.map((user) => (
                <div key={user.id} className="user-result">
                  <div className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-username">{user.username}</span>
                  <button
                    onClick={() => handleSendFriendRequest(user.username)}
                    className="send-request-button"
                    title="Send friend request"
                  >
                    <span className="button-icon">+</span>
                    <span className="button-text">Add Friend</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Incoming Friend Requests */}
      <div className="incoming-requests-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">📥</span>
            Friend Requests
            {friendRequests.length > 0 && (
              <span className="request-count">{friendRequests.length}</span>
            )}
          </h3>
          <p className="section-subtitle">
            {friendRequests.length === 0 
              ? 'No pending requests' 
              : 'Requests waiting for your response'}
          </p>
        </div>
        
        <div className="requests-list">
          {friendRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p className="empty-text">No incoming friend requests</p>
            </div>
          ) : (
            friendRequests.map((request) => (
              <div key={request.id} className="request-card incoming-request">
                <div className="request-info">
                  <div className="request-avatar">
                    {request.fromUsername.charAt(0).toUpperCase()}
                  </div>
                  <div className="request-details">
                    <span className="request-username">{request.fromUsername}</span>
                    <span className="request-date">
                      Sent on {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="request-actions">
                  <button
                    onClick={() => onAcceptFriendRequest(request.id)}
                    className="action-button accept-button"
                  >
                    <span className="button-icon">✓</span>
                    <span className="button-text">Accept</span>
                  </button>
                  <button
                    onClick={() => onDeclineFriendRequest(request.id)}
                    className="action-button decline-button"
                  >
                    <span className="button-icon">✕</span>
                    <span className="button-text">Decline</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sent Friend Requests */}
      <div className="sent-requests-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">📤</span>
            Sent Requests
            {pendingRequests.length > 0 && (
              <span className="request-count">{pendingRequests.length}</span>
            )}
          </h3>
          <p className="section-subtitle">
            {pendingRequests.length === 0 
              ? 'No pending sent requests' 
              : 'Waiting for friends to accept'}
          </p>
        </div>
        
        <div className="requests-list">
          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p className="empty-text">No sent requests</p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="request-card sent-request">
                <div className="request-info">
                  <div className="request-avatar">
                    {request.toUsername.charAt(0).toUpperCase()}
                  </div>
                  <div className="request-details">
                    <span className="request-username">{request.toUsername}</span>
                    <span className="request-date">
                      Sent on {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="request-status">
                  <div className="status-indicator pending"></div>
                  <span className="status-text">Pending</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FriendRequests;