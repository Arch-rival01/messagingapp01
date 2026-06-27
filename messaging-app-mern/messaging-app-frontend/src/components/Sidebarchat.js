import React from 'react';
import { Avatar } from '@mui/material';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils';

const SidebarChat = ({ targetUser, currentUser, isOnline, lastMessage }) => {
    // Generate a unique room ID by sorting the two UIDs
    // This ensures that A+B and B+A always result in the same room ID
    const roomId = [currentUser.uid, targetUser.uid].sort().join('_');

    return(
        <Link to={`/rooms/${roomId}`} state={{ targetUser }}>
            <div className="flex items-center p-3 cursor-pointer transition-all duration-200 rounded-2xl group bg-white border border-transparent hover:bg-blue-50 hover:border-blue-100/50 hover:shadow-sm relative">
                <div className="relative">
                    <Avatar src={targetUser.photoURL} className="shadow-sm group-hover:scale-105 transition-transform" />
                    {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10 shadow-sm" title="Online"></div>
                    )}
                </div>
                <div className="ml-4 flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[15px] font-bold tracking-tight text-slate-800 group-hover:text-blue-900 transition-colors truncate">
                            {targetUser.name}
                        </h2>
                        {lastMessage && (
                            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap ml-2">
                                {formatTimestamp(lastMessage.createdAt)}
                            </span>
                        )}
                    </div>
                    <p className="text-[13px] truncate mt-0.5 font-medium text-slate-500 group-hover:text-blue-600/80 transition-colors">
                        {lastMessage ? lastMessage.text : "Click to chat..."}
                    </p>
                </div>
            </div>
        </Link>
    )
}
export default SidebarChat;