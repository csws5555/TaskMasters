import React from 'react';
import './FriendsList.css';
import ChatButton from './ChatButton'; 

function FriendsList({ 
  user, 
  friends, 
  friendsLoading, 
  onRemoveFriend, 
  showMessage, 
  loadFriends 
}) {
  console.log('Rendering friends:', friends);
  return (
    <div className="friends-list-container">
      <div className="section-header">
        <h3 className="section-title">
          <span className="section-icon">👥</span>
          Your Friends
          <span className="friends-count">({friends.length})</span>
        </h3>
        {friends.length > 0 && (
          <p className="section-subtitle">
            You have {friends.length} amazing friend{friends.length !== 1 ? 's' : ''}!
          </p>
        )}
      </div>
      
      <div className="friends-content">
        {friendsLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your friends...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌈</div>
            <h4 className="empty-title">No friends yet</h4>
            <p className="empty-text">
              Your friend list is waiting to be filled with amazing connections!
            </p>
            <p className="empty-subtext">
              Switch to the Requests tab to send friend requests and start building your network.
            </p>
          </div>
        ) : (
          <div className="friends-grid">
            {friends.map((friend, index) => (
              <div 
                key={friend.id} 
                className="friend-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="friend-avatar">
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                
                <div className="friend-info">
                  <h4 className="friend-username">{friend.username}</h4>
                  <p className="friend-since">
                    <span className="since-icon">📅</span>
                    Friends since {new Date(friend.friendsSince).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="friend-actions">
                  <ChatButton user={user} friend={friend} />
                  <button
                    onClick={() => onRemoveFriend(friend.id)}
                    className="remove-button"
                    title="Remove friend"
                  >
                    <span className="button-icon">👋</span>
                    <span className="button-text">Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsList;