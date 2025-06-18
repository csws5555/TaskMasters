import React, { useState } from 'react';
import ChatWindow from './ChatWindow';

function ChatButton({ user, friend }) {
  const [showChat, setShowChat] = useState(false);

  console.log('ChatButton render - showChat:', showChat); // Debug log

  return (
    <>
      <button 
        onClick={() => {
          console.log('Chat button clicked'); // Debug log
          setShowChat(true);
        }}
        className="chat-button"
        title="Chat with friend"
      >
        💬 Chat
      </button>
      
      {showChat && (
        <ChatWindow 
          user={user} 
          friend={friend} 
          onClose={() => {
            console.log('onClose triggered'); // Debug log
            setShowChat(false);
          }} 
        />
      )}
    </>
  );
}

export default ChatButton;