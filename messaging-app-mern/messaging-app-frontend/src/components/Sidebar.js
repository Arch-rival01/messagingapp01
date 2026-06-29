import React, { useState, useEffect } from 'react';
import { Avatar, IconButton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { DonutLarge, Chat as ChatIcon, MoreVert, SearchOutlined, AdminPanelSettings } from '@mui/icons-material';
import Sidebarchat from './Sidebarchat';
import { useStateValue } from '../StateProvider';
import { socket } from '../App';
import { auth } from '../firebase';

const Sidebar = () => {
    const [{ user }] = useStateValue();
    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [lastMessages, setLastMessages] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation();
    const isContentRoute = location.pathname.includes('/rooms/') || location.pathname.includes('/admin');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (user && auth.currentUser) {
                try {
                    const token = await auth.currentUser.getIdToken();
                    
                    // Fetch registered users
                    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/users`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(res => res.json())
                        .then(data => {
                            setUsers(data.filter(u => u.uid !== user.uid));
                        })
                        .catch(err => console.error(err));
                    
                    // Fetch last messages and unread counts
                    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/messages/last/${user.uid}?name=${encodeURIComponent(user.displayName || '')}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(res => res.json())
                        .then(data => {
                            const initialLastMessages = {};
                            const initialUnreadCounts = {};
                            Object.keys(data).forEach(roomId => {
                                initialLastMessages[roomId] = data[roomId].lastMessage;
                                initialUnreadCounts[roomId] = data[roomId].unreadCount;
                            });
                            setLastMessages(initialLastMessages);
                            setUnreadCounts(prev => ({ ...initialUnreadCounts, ...prev }));
                        })
                        .catch(err => console.error(err));
                } catch (error) {
                    console.error("Error fetching token", error);
                }
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        const handleOnlineUsers = (usersArray) => {
            setOnlineUsers(usersArray);
        };

        const handleNewUser = (newUser) => {
            if (newUser.uid !== user?.uid) {
                setUsers(prev => {
                    // Prevent duplicates
                    if (prev.some(u => u.uid === newUser.uid)) return prev;
                    return [...prev, newUser];
                });
            }
        };

        const handleInsertedMessage = (newMsg) => {
            setLastMessages(prev => ({
                ...prev,
                [newMsg.roomId]: newMsg
            }));

            // If the message is not from the current user and we are not in that chat room, increment unread count
            if (newMsg.sender !== user?.displayName) {
                // Get the current roomId from location if we are on a chat route
                const currentRoomId = location.pathname.includes('/rooms/') ? location.pathname.split('/rooms/')[1] : null;
                
                if (currentRoomId !== newMsg.roomId) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [newMsg.roomId]: (prev[newMsg.roomId] || 0) + 1
                    }));
                }
            }
        };

        const handleMessagesRead = ({ roomId, readerName }) => {
            if (readerName === user?.displayName) {
                // If I read the messages, clear the count on my side
                setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
            }
        };

        const handleUserDeleted = (deletedUid) => {
            setUsers(prev => prev.filter(u => u.uid !== deletedUid));
        };

        socket.on('onlineUsers', handleOnlineUsers);
        socket.on('newUser', handleNewUser);
        socket.on('inserted', handleInsertedMessage);
        socket.on('messagesRead', handleMessagesRead);
        socket.on('userDeleted', handleUserDeleted);

        return () => {
            socket.off('onlineUsers', handleOnlineUsers);
            socket.off('newUser', handleNewUser);
            socket.off('inserted', handleInsertedMessage);
            socket.off('messagesRead', handleMessagesRead);
            socket.off('userDeleted', handleUserDeleted);
        };
    }, [user, location.pathname]);

    // Clear unread counts when navigating to a room
    useEffect(() => {
        if (location.pathname.includes('/rooms/')) {
            const currentRoomId = location.pathname.split('/rooms/')[1];
            if (unreadCounts[currentRoomId]) {
                setUnreadCounts(prev => ({ ...prev, [currentRoomId]: 0 }));
            }
        }
    }, [location.pathname, unreadCounts]);

    return(
        <div className={`flex-col w-full md:w-[350px] lg:w-[400px] h-full border-r border-slate-200 bg-white flex-shrink-0 ${isContentRoute ? 'hidden md:flex' : 'flex'}`}>
            {/* Sidebar Header */}
            <div className="flex justify-between items-center p-4 bg-white/95 backdrop-blur border-b border-slate-100 z-10 sticky top-0">
                <Avatar src={user?.photoURL} />
                <div className="flex space-x-1">
                    {user?.email === process.env.REACT_APP_ADMIN_EMAIL && (
                        <IconButton onClick={() => navigate('/admin')} className="!text-rose-500 hover:!bg-rose-50 transition-colors" title="Admin Panel">
                            <AdminPanelSettings />
                        </IconButton>
                    )}
                    <IconButton className="!text-slate-500 hover:!bg-slate-100 transition-colors">
                        <DonutLarge />
                    </IconButton>
                    <IconButton className="!text-slate-500 hover:!bg-slate-100 transition-colors">
                        <ChatIcon />
                    </IconButton>
                    <IconButton className="!text-slate-500 hover:!bg-slate-100 transition-colors">
                        <MoreVert />
                    </IconButton>
                </div>
            </div>

            {/* Sidebar Search */}
            <div className="p-3 bg-white border-b border-slate-100">
                <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition-all">
                    <SearchOutlined className="text-slate-400" />
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search or start new chat" 
                        type="text" 
                        className="bg-transparent outline-none border-none flex-1 ml-3 text-[15px] placeholder-slate-400 text-slate-700" 
                    />
                </div>
            </div>

            {/* Sidebar Chats (Direct Messages) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/30 custom-scrollbar p-2 space-y-1">
                {users.filter(u => 
                    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(u => {
                    const roomId = [user.uid, u.uid].sort().join('_');
                    const lastMsg = lastMessages[roomId];
                    return (
                        <Sidebarchat 
                            key={u.uid} 
                            targetUser={u} 
                            currentUser={user} 
                            isOnline={onlineUsers.includes(u.uid)}
                            lastMessage={lastMsg}
                            unreadCount={unreadCounts[roomId] || 0}
                        />
                    );
                })}
            </div>
        </div>    
    )
}
export default Sidebar;
