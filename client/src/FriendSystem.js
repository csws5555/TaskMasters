import React, { useState, useEffect } from 'react';
import FriendsList from './FriendsList';
import FriendRequests from './FriendRequests';
import './FriendSystem.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000'; 
console.log('API URL (Task):', API_URL);

function FriendSystem({ user, showMessage }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Load friends and requests when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load friends from server
const loadFriends = async () => {
  try {
    setFriendsLoading(true);
    const response = await fetch(`${API_URL}/friends/${user.id}`);
    
    console.log('Response status:', response.status); // Debug log
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to load friends');
    }

    const data = await response.json();
    console.log('API response data:', data); // Debug log
    
    setFriends(data.map(friend => ({
      id: friend.id,
      username: friend.username,
      friendsSince: friend.friendsSince || new Date().toISOString()
    })));
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack
    });
    showMessage(error.message, 'error');
  } finally {
    setFriendsLoading(false);
  }
};

  // Load friend requests from server
const loadFriendRequests = async () => {
  try {
    const [incomingResponse, outgoingResponse] = await Promise.all([
      fetch(`${API_URL}/friends/requests/incoming/${user.id}`),
      fetch(`${API_URL}/friends/requests/outgoing/${user.id}`)
    ]);

    if (!incomingResponse.ok) throw new Error('Failed to load incoming requests');
    if (!outgoingResponse.ok) throw new Error('Failed to load outgoing requests');

    const incoming = await incomingResponse.json();
    const outgoing = await outgoingResponse.json();

    setFriendRequests(incoming.map(req => ({
      id: req.id,
      fromUserId: req.fromUserId,
      fromUsername: req.fromUsername,
      status: req.status
    })));
    
    setPendingRequests(outgoing.map(req => ({
      id: req.id,
      toUserId: req.toUserId,
      toUsername: req.toUsername,
      status: req.status
    })));
  } catch (error) {
    console.error('Error loading friend requests:', error);
    showMessage(error.message, 'error');
  }
};

  // Send friend request
const sendFriendRequest = async (username) => {
  try {
    const response = await fetch(`${API_URL}/friends/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUserId: user.id,
        toUsername: username
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send friend request');
    }

    showMessage(`Friend request sent to ${username} successfully!`, 'success');
    // Force refresh both lists
    await loadFriendRequests();
    setActiveTab('requests'); // Switch to requests tab
  } catch (error) {
    console.error('Error sending friend request:', error);
    showMessage(error.message, 'error');
  }
};

  // Accept friend request
// Update this function in FriendSystem.js
const acceptFriendRequest = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/friends/requests/${requestId}/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to accept friend request');
    }

    showMessage('Friend request accepted!');
    // Refresh both lists
    await loadFriends();
    await loadFriendRequests();
  } catch (error) {
    console.error('Error accepting friend request:', error);
    showMessage(error.message, 'error');
  }
};

  // Decline friend request
  const declineFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/friends/requests/${requestId}/decline`, {
        method: 'PUT'
      });

      if (response.ok) {
        showMessage('Friend request declined');
        loadFriendRequests();
      } else {
        showMessage('Failed to decline friend request', 'error');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      showMessage('Error declining friend request', 'error');
    }
  };

  // Remove friend
  const removeFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/friends/${user.id}/${friendId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('Friend removed successfully');
        loadFriends();
      } else {
        showMessage('Failed to remove friend', 'error');
      }
    } catch (error) {
      console.error('Error removing friend', error);
      showMessage('Error removing friend', 'error');
    }
  };

  return (
    <div className="friend-system-container">
      <div className="friend-system-header">
        <h2 className="system-title">
          <span className="title-icon">👥</span>
          Friend Hub
        </h2>
        <p className="system-subtitle">Connect with friends and manage your social circle</p>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="tab-navigation">
        <button 
          onClick={() => setActiveTab('friends')}
          className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
        >
          <span className="tab-icon">👫</span>
          <span className="tab-text">My Friends</span>
          {friends.length > 0 && (
            <span className="tab-count">{friends.length}</span>
          )}
        </button>
        
        <button 
          onClick={() => setActiveTab('requests')}
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
        >
          <span className="tab-icon">✉️</span>
          <span className="tab-text">Requests</span>
          {friendRequests.length > 0 && (
            <span className="tab-notification">{friendRequests.length}</span>
          )}
        </button>
      </div>

      {/* Tab Content with Animation */}
      <div className="tab-content">
        {activeTab === 'friends' && (
          <div className="tab-panel friends-panel">
            <FriendsList 
              user={user}
              friends={friends}
              friendsLoading={friendsLoading}
              onRemoveFriend={removeFriend}
              showMessage={showMessage}
              loadFriends={loadFriends}
            />
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="tab-panel requests-panel">
            <FriendRequests 
              user={user}
              friendRequests={friendRequests}
              pendingRequests={pendingRequests}
              onSendFriendRequest={sendFriendRequest}
              onAcceptFriendRequest={acceptFriendRequest}
              onDeclineFriendRequest={declineFriendRequest}
              showMessage={showMessage}
              loadFriendRequests={loadFriendRequests} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendSystem;