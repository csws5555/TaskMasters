import React from 'react';
import './FriendRequests.css';

function FriendRequests({ 
  user, 
  friendRequests, 
  pendingRequests, 
  onSendFriendRequest, 
  onAcceptFriendRequest, 
  onDeclineFriendRequest 
}) {
  // Friend request form handler
  const handleSendFriendRequest = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    if (username.trim()) {
      onSendFriendRequest(username.trim());
      e.target.reset();
    }
  };

  return (
    <div className="friend-requests-container">
      {/* Send Friend Request Form */}
      <div className="send-request-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">🚀</span>
            Send Friend Request
          </h3>
          <p className="section-subtitle">Connect with new friends by their username</p>
        </div>
        
        <form onSubmit={handleSendFriendRequest} className="send-request-form">
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Enter username..."
              className="username-input"
              required
            />
            <button type="submit" className="send-button">
              <span className="button-icon">➤</span>
              <span className="button-text">Send Request</span>
            </button>
          </div>
        </form>
      </div>

      {/* Incoming Friend Requests */}
      <div className="incoming-requests-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">📬</span>
            Incoming Requests
            <span className="request-count">({friendRequests.length})</span>
          </h3>
        </div>
        
        <div className="requests-list">
          {friendRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🌟</div>
              <p className="empty-text">No incoming friend requests</p>
              <p className="empty-subtext">You're all caught up!</p>
            </div>
          ) : (
            friendRequests.map((request, index) => (
              <div key={request.id} className="request-card incoming-request" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="request-info">
                  <div className="request-avatar">
                    {request.fromUsername.charAt(0).toUpperCase()}
                  </div>
                  <div className="request-details">
                    <span className="request-username">{request.fromUsername}</span>
                    <span className="request-message">wants to be your friend</span>
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

      {/* Pending Outgoing Requests */}
      <div className="pending-requests-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">⏳</span>
            Sent Requests
            <span className="request-count">({pendingRequests.length})</span>
          </h3>
        </div>
        
        <div className="requests-list">
          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📤</div>
              <p className="empty-text">No pending requests</p>
              <p className="empty-subtext">Send a friend request above!</p>
            </div>
          ) : (
            pendingRequests.map((request, index) => (
              <div key={request.id} className="request-card pending-request" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="request-info">
                  <div className="request-avatar pending-avatar">
                    {request.toUsername.charAt(0).toUpperCase()}
                  </div>
                  <div className="request-details">
                    <span className="request-username">{request.toUsername}</span>
                    <span className="request-message">Request sent</span>
                  </div>
                </div>
                
                <div className="pending-status">
                  <div className="pulse-dot"></div>
                  <span className="status-text">Pending...</span>
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