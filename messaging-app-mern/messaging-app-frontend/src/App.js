import './App.css';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import { useStateValue } from './StateProvider';

// 1. Create socket OUTSIDE the component so it persists across renders
const socket = io('http://localhost:9000', {
  transports: ['websocket'],
});

function App() {
  const [messages, setMessages] = useState([]);
  const [{ user }, dispatch] = useStateValue(); // Pull user from Data Layer

  // Fetch initial messages when the app loads
  useEffect(() => {
    fetch('http://localhost:9000/messages/sync')
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setMessages(data.messages);
        }
      })
      .catch((error) => console.error('Error fetching messages:', error));
  }, []);

  useEffect(() => {
    // 2. Attach listeners when component mounts
    socket.on('connect', () => {
      console.log('✅ Socket.io CONNECTED! ID:', socket.id);
    });

    socket.on('inserted', (data) => {
      console.log('🎉 New message received:', data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('deleted', (deletedId) => {
      console.log('🗑️ Message deleted:', deletedId);
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== deletedId));
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
    });

    // 3. Cleanup listeners when component unmounts
    return () => {
      socket.off('connect');
      socket.off('inserted');
      socket.off('deleted');
      socket.off('disconnect');
    };
  }, []);

  return (
    <div className="app">
      {!user ? (
        <Login />
      ) : (
        <div className="app__body">
          <Sidebar />
          <Chat messages={messages} />
        </div>
      )}
    </div>
  );
}

export default App;
