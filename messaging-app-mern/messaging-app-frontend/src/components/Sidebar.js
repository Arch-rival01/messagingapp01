import React, { useState, useEffect } from 'react';
import { Avatar, IconButton } from '@mui/material';
import { DonutLarge, Chat as ChatIcon, MoreVert, SearchOutlined } from '@mui/icons-material';
import Sidebarchat from './Sidebarchat';
import { useStateValue } from '../StateProvider';
import { socket } from '../App';

const Sidebar = () => {
    const [{ user }] = useStateValue();
    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [lastMessages, setLastMessages] = useState({});

    useEffect(() => {
        if (user) {
            // Fetch registered users
            fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/users`)
                .then(res => res.json())
                .then(data => {
                    setUsers(data.filter(u => u.uid !== user.uid));
                })
                .catch(err => console.error(err));
            
            // Fetch last messages
            fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/messages/last/${user.uid}`)
                .then(res => res.json())
                .then(data => {
                    setLastMessages(data);
                })
                .catch(err => console.error(err));
        }
    }, [user]);

    useEffect(() => {
        const handleOnlineUsers = (usersArray) => {
            setOnlineUsers(usersArray);
        };
        socket.on('onlineUsers', handleOnlineUsers);
        return () => socket.off('onlineUsers', handleOnlineUsers);
    }, []);

    return(
        <div className="hidden md:flex flex-col w-full md:w-[350px] lg:w-[400px] h-full border-r border-slate-200 bg-white flex-shrink-0">
            {/* Sidebar Header */}
            <div className="flex justify-between items-center p-4 bg-white/95 backdrop-blur border-b border-slate-100 z-10 sticky top-0">
                <Avatar src={user?.photoURL} />
                <div className="flex space-x-1">
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
                        placeholder="Search or start new chat" 
                        type="text" 
                        className="bg-transparent outline-none border-none flex-1 ml-3 text-[15px] placeholder-slate-400 text-slate-700" 
                    />
                </div>
            </div>

            {/* Sidebar Chats (Direct Messages) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/30 custom-scrollbar p-2 space-y-1">
                {users.map(u => {
                    const roomId = [user.uid, u.uid].sort().join('_');
                    const lastMsg = lastMessages[roomId];
                    return (
                        <Sidebarchat 
                            key={u.uid} 
                            targetUser={u} 
                            currentUser={user} 
                            isOnline={onlineUsers.includes(u.uid)}
                            lastMessage={lastMsg}
                        />
                    );
                })}
            </div>
        </div>    
    )
}
export default Sidebar;
