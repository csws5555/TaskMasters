import React, { useState, useEffect } from 'react';
import FriendsList from './FriendsList';
import FriendRequests from './FriendRequests';
import './FriendSystem.css';

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
      const response = await fetch(`http://localhost:5000/friends/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  // Load friend requests from server
  const loadFriendRequests = async () => {
    try {
      const [incomingResponse, outgoingResponse] = await Promise.all([
        fetch(`http://localhost:5000/friends/requests/incoming/${user.id}`),
        fetch(`http://localhost:5000/friends/requests/outgoing/${user.id}`)
      ]);

      if (incomingResponse.ok) {
        const incoming = await incomingResponse.json();
        setFriendRequests(incoming);
      }

      if (outgoingResponse.ok) {
        const outgoing = await outgoingResponse.json();
        setPendingRequests(outgoing);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  // Send friend request
  const sendFriendRequest = async (username) => {
    try {
      const response = await fetch('http://localhost:5000/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.id,
          toUsername: username
        })
      });

      if (response.ok) {
        showMessage('Friend request sent successfully!');
        loadFriendRequests(); // Refresh pending requests
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to send friend request', 'error');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      showMessage('Error sending friend request', 'error');
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:5000/friends/requests/${requestId}/accept`, {
        method: 'PUT'
      });

      if (response.ok) {
        showMessage('Friend request accepted!');
        loadFriends();
        loadFriendRequests();
      } else {
        showMessage('Failed to accept friend request', 'error');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      showMessage('Error accepting friend request', 'error');
    }
  };

  // Decline friend request
  const declineFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:5000/friends/requests/${requestId}/decline`, {
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
      const response = await fetch(`http://localhost:5000/friends/${user.id}/${friendId}`, {
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
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendSystem;