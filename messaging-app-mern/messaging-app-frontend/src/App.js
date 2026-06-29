import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import AdminPanel from './components/AdminPanel';
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { MinimalAuthPage } from './components/MinimalAuthPage';
import { useStateValue } from './StateProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { auth, messaging } from './firebase';
import { actionTypes } from './reducer';
import { getToken } from 'firebase/messaging';

// 1. Create socket OUTSIDE the component so it persists across renders
export const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:9000', {
  transports: ['websocket'],
});

function App() {
  const [{ user }, dispatch] = useStateValue(); // Pull user from Data Layer
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        dispatch({
          type: actionTypes.SET_USER,
          user: authUser,
        });
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted' && auth.currentUser) {
          const token = await getToken(messaging, { 
            vapidKey: 'BG9SxC6umjASYrhM9LKmpfqmfALHzpCipXlJnrzO2OWtf2A76P-FXxqZpKxrkMHOnGlurc3SUQ_RlnE5fKHeuw0' 
          });
          if (token) {
            const idToken = await auth.currentUser.getIdToken();
            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/users/fcm-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({ token })
            });
          }
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
      }
    };

    if (user) {
      socket.emit('setup', user.uid);
      requestNotificationPermission();
    }
  }, [user]);

  if (isAuthChecking) {
    return <div className="fixed inset-0 flex items-center justify-center bg-slate-50"><p className="text-slate-500 font-medium animate-pulse">Loading...</p></div>;
  }

  return (
    <div className="fixed top-0 left-0 h-[100dvh] w-full bg-slate-50 flex overflow-hidden">
      {!user ? (
        <MinimalAuthPage />
      ) : (
        <div className="flex h-full w-full max-w-[1920px] mx-auto bg-white shadow-2xl relative overflow-hidden">
          <BrowserRouter>
            <Sidebar />
            <Routes>
              <Route path="/rooms/:roomId" element={<Chat />} />
              <Route path="/admin" element={<AdminPanel />} />
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
