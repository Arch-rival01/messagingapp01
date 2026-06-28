import React, { useEffect, useState, useRef } from 'react';
import { Avatar, IconButton } from '@mui/material';
import { MicRounded, AttachFile, MoreVert, SearchOutlined, InsertEmoticon, SendRounded, ArrowBack } from '@mui/icons-material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../App';
import { useStateValue } from '../StateProvider';
import EmojiPicker from 'emoji-picker-react';
import { formatTimestamp } from '../utils';
import { auth } from '../firebase';

const Chat = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const targetUser = location.state?.targetUser; // Grab the user passed from the Sidebar Link

    const [messages, setMessages] = useState([]);
    const [{ user }] = useStateValue();
    const [input, setInput] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);

    // Auto-scroll to the bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            if (roomId && auth.currentUser) {
                try {
                    const token = await auth.currentUser.getIdToken();
                    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/messages/${roomId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                setMessages(data.messages);
                            }
                        })
                        .catch(err => console.error(err));
                } catch (error) {
                    console.error("Error getting token", error);
                }
            }
        };
        fetchMessages();
    }, [roomId]);

    useEffect(() => {
        const handleInserted = (data) => {
            if (data.roomId === roomId) {
                setMessages(prev => [...prev, data]);
            }
        };

        const handleDeleted = (deletedId) => {
            setMessages(prev => prev.filter(msg => msg._id !== deletedId));
        };

        socket.on('inserted', handleInserted);
        socket.on('deleted', handleDeleted);

        return () => {
            socket.off('inserted', handleInserted);
            socket.off('deleted', handleDeleted);
        };
    }, [roomId]);

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!input.trim() || !auth.currentUser) return; // Don't send empty messages

        try {
            const token = await auth.currentUser.getIdToken();
            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: input,
                    sender: user?.displayName || 'Unknown User', 
                    roomId: roomId,
                })
            });

            setInput(""); 
            setShowEmojiPicker(false); 
        } catch (error) {
            console.error("Error sending message", error);
        }
    };

    const deleteMessage = async (id) => {
        if (!auth.currentUser) return;
        try {
            const token = await auth.currentUser.getIdToken();
            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/messages/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const handleEmojiClick = (emojiObject) => {
        setInput(prevInput => prevInput + emojiObject.emoji);
    };

    if (!targetUser) {
        return (
            <div className="flex flex-col flex-1 h-full bg-slate-100 relative overflow-hidden w-full items-center justify-center text-slate-400">
                <p>Select a user to start chatting</p>
            </div>
        );
    }

    return(
        <div className="flex flex-col flex-1 h-full bg-[#f0f2f5] relative overflow-hidden w-full">
            {/* Chat Header */}
            <div className="flex items-center p-4 bg-white/95 backdrop-blur border-b border-slate-100 z-20 sticky top-0 shadow-sm">
                <div className="md:hidden mr-2">
                    <IconButton onClick={() => navigate('/')} className="!text-slate-500 hover:!bg-slate-100">
                        <ArrowBack />
                    </IconButton>
                </div>
                <Avatar src={targetUser.photoURL} className="shadow-sm" />
                <div className="ml-4 flex-1">
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">{targetUser.name}</h3>
                    <p className="text-[13px] text-slate-500 font-medium">{targetUser.email}</p>
                </div>
                <div className="flex space-x-1 hidden sm:flex">
                    <IconButton className="!text-slate-500 hover:!bg-slate-100 transition-colors">
                        <SearchOutlined />
                    </IconButton>
                    <IconButton className="!text-slate-500 hover:!bg-slate-100 transition-colors">
                        <MoreVert />
                    </IconButton>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col space-y-4 custom-scrollbar">
                {messages.map((message) => {
                    const isSender = message.sender === user?.displayName;
                    return (
                        <div key={message._id} className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isSender ? "self-end items-end" : "self-start items-start"}`}>
                            {!isSender && <span className="text-[11px] font-semibold text-slate-400 ml-3 mb-1">{message.sender}</span>}
                            
                            <div className={`relative group px-4 py-2 sm:px-5 sm:py-2.5 text-[15px] leading-relaxed 
                                ${isSender ? "bg-[#d9fdd3] text-slate-800 shadow-sm rounded-[18px] rounded-tr-[4px]" : "bg-white text-slate-800 shadow-sm rounded-[18px] rounded-tl-[4px]"}`}>
                                
                                {message.text}
                                
                                {isSender && (
                                    <span onClick={() => deleteMessage(message._id)} className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-base p-1.5 hover:bg-red-100 text-red-500 rounded-full bg-slate-50 shadow-sm">
                                        🗑️
                                    </span>
                                )}
                            </div>
                            
                            <span className={`text-[10px] font-medium text-slate-400 mt-1 ${isSender ? "mr-2" : "ml-2"}`}>
                                {formatTimestamp(message.createdAt)}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Footer (Floating Input) */}
            <div className="p-4 sm:p-6 bg-transparent w-full flex justify-center z-20">
                <div className="w-full max-w-4xl bg-white shadow-sm rounded-full flex items-center p-2 border border-slate-200 relative">
                    <div ref={emojiPickerRef} className="flex items-center">
                        {showEmojiPicker && (
                            <div className="absolute bottom-16 left-0 shadow-2xl rounded-2xl overflow-hidden border border-slate-100 bg-white z-50">
                                <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </div>
                        )}
                        
                        <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="!text-slate-400 hover:!text-slate-600 transition-colors">
                            <InsertEmoticon />
                        </IconButton>
                    </div>
                    <IconButton className="!text-slate-400 hover:!text-slate-600 transition-colors">
                        <AttachFile />
                    </IconButton>
                    
                    <form className="flex-1 flex items-center mx-2" onSubmit={sendMessage}>
                        <input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            type="text" 
                            className="w-full bg-transparent border-none outline-none text-slate-700 placeholder-slate-400 text-[15px]"
                            placeholder="Type a message..." 
                        />
                        <button type="submit" className="hidden">Send</button>
                    </form>
                    
                    <div className="flex items-center space-x-1 mr-1">
                        <IconButton className="!text-slate-400 hover:!text-slate-600 transition-colors hidden sm:inline-flex">
                            <MicRounded />
                        </IconButton>
                        <IconButton onClick={sendMessage} className="!bg-[#00a884] hover:!bg-[#008f6f] !text-white shadow-md transition-colors !p-2.5">
                            <SendRounded fontSize="small" />
                        </IconButton>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Chat;
