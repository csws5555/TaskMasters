import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatWindow.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000'; 
console.log('API URL (Task):', API_URL);

function ChatWindow({ user, friend, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Wrap loadMessages in useCallback to avoid useEffect warnings
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/messages/${user.id}/${friend.id}`);
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data);
      
      // Mark messages as read
      await fetch(`${API_URL}/messages/read`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ userId: user.id, friendId: friend.id })
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [user.id, friend.id]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]); // Now includes loadMessages in dependencies

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  //send message
  const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim() || isSending) return;

  console.log('Sending message payload:', {
    sender_id: user.id,
    receiver_id: friend.id,
    message: newMessage
  });

  setIsSending(true);
  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender_id: user.id,
        receiver_id: friend.id,
        message: newMessage
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response error:', errorText);
      throw new Error(errorText || 'Failed to send message');
    }

    const data = await response.json();
    console.log('Server response data:', data);
    
    setNewMessage('');
    setMessages(prev => [...prev, {
      ...data,
      sender_name: user.username
    }]);
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack
    });
    alert(`Failed to send message: ${error.message}`);
  } finally {
    setIsSending(false);
  }
};

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat with {friend.username}</h3>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            console.log('Closing chat');
            onClose();
          }} 
          className="close-chat" 
          aria-label="Close chat"
        >
          × 
        </button>
      </div>
      
      <div className="messages-container">
        {messages.map((msg) => (
          <div 
            key={msg.id || msg.timestamp} 
            className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
          >
            <div className="message-content">{msg.message}</div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
        />
        <button 
          type="submit" 
          disabled={isSending || !newMessage.trim()}
          className={isSending ? 'sending' : ''}
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;