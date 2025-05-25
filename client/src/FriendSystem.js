import React, { useState, useEffect } from 'react';
import './FriendSystem.css';

function FriendSystem({ userId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');

  // Update the useEffect in FriendSystem.js
useEffect(() => {
    const fetchFriendRequests = () => {
        fetch(`http://localhost:5000/friends/requests/${userId}`)
            .then(res => res.json())
            .then(data => setFriendRequests(data));
  };

  const fetchFriends = () => {
    fetch(`http://localhost:5000/friends/${userId}`)
      .then(res => res.json())
      .then(data => setFriends(data));
  };

  if (userId) {
    fetchFriendRequests();
    fetchFriends();
  }
}, [userId]);  

  const fetchFriendRequests = () => {
    fetch(`http://localhost:5000/friends/requests/${userId}`)
      .then(res => res.json())
      .then(data => setFriendRequests(data));
  };

  const fetchFriends = () => {
    fetch(`http://localhost:5000/friends/${userId}`)
      .then(res => res.json())
      .then(data => setFriends(data));
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    fetch(`http://localhost:5000/users/search/${searchTerm}`)
      .then(res => res.json())
      .then(data => {
        // Filter out current user and existing friends/requests
        const filtered = data.filter(user => 
          user.id !== userId && 
          !friends.some(f => f.id === user.id) &&
          !friendRequests.some(fr => fr.userId === user.id)
        );
        setSearchResults(filtered);
      });
  };

  const sendFriendRequest = (toUserId) => {
    fetch('http://localhost:5000/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId: userId, toUserId })
    })
    .then(res => res.json())
    .then(() => {
      setSearchResults(searchResults.filter(user => user.id !== toUserId));
      alert('Friend request sent!');
    });
  };

  const respondToRequest = (requestId, accept) => {
    fetch('http://localhost:5000/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, userId, accept })
    })
    .then(res => res.json())
    .then(() => {
      fetchFriendRequests();
      if (accept) fetchFriends();
    });
  };

  return (
    <div className="friend-system">
      <div className="friend-tabs">
        <button 
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button 
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({friendRequests.length})
        </button>
        <button 
          className={activeTab === 'add' ? 'active' : ''}
          onClick={() => setActiveTab('add')}
        >
          Add Friend
        </button>
      </div>

      <div className="friend-content">
        {activeTab === 'friends' && (
          <div className="friends-list">
            {friends.length === 0 ? (
              <p>No friends yet. Add some friends!</p>
            ) : (
              <ul>
                {friends.map(friend => (
                  <li key={friend.id}>
                    <span>{friend.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-list">
            {friendRequests.length === 0 ? (
              <p>No pending requests</p>
            ) : (
              <ul>
                {friendRequests.map(request => (
                  <li key={request.id}>
                    <span>{request.username}</span>
                    <div className="request-actions">
                      <button onClick={() => respondToRequest(request.id, true)}>Accept</button>
                      <button onClick={() => respondToRequest(request.id, false)}>Decline</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="add-friend">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by username"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button onClick={handleSearch}>Search</button>
            </div>
            
            <div className="search-results">
              {searchResults.length === 0 ? (
                <p>No users found</p>
              ) : (
                <ul>
                  {searchResults.map(user => (
                    <li key={user.id}>
                      <span>{user.username}</span>
                      <button onClick={() => sendFriendRequest(user.id)}>Add Friend</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendSystem;