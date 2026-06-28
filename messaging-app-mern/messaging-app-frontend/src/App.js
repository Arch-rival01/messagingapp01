import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { MinimalAuthPage } from './components/MinimalAuthPage';
import { useStateValue } from './StateProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. Create socket OUTSIDE the component so it persists across renders
export const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:9000', {
  transports: ['websocket'],
});

function App() {
  const [{ user }] = useStateValue(); // Pull user from Data Layer

  useEffect(() => {
    if (user) {
      socket.emit('setup', user.uid);
    }
  }, [user]);

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden">
      {!user ? (
        <MinimalAuthPage />
      ) : (
        <div className="flex h-full w-full max-w-[1920px] mx-auto bg-white shadow-2xl relative overflow-hidden">
          <BrowserRouter>
            <Sidebar />
            <Routes>
              <Route path="/rooms/:roomId" element={<Chat />} />
              <Route path="/" element={
                <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50 text-slate-400 font-medium">
                  <p className="text-xl">Welcome to Messaging App</p>
                  <p className="text-sm mt-2">Select a room or create a new one to start chatting.</p>
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </div>
      )}
    </div>
  );
}

export default App;
