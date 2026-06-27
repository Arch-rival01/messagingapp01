import React, { useEffect, useState, useRef } from 'react';
import './Chat.css';
import { Avatar, IconButton } from '@mui/material';
import { MicRounded, AttachFile, MoreVert, SearchOutlined, InsertEmoticon } from '@mui/icons-material';
import { useStateValue } from '../StateProvider';

const Chat = ({ messages = [] }) => {
    const [{ user }, dispatch] = useStateValue();
    const [input, setInput] = useState("");
    const [seed, setSeed] = useState("");
    const messagesEndRef = useRef(null);

    // Auto-scroll to the bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        setSeed(Math.floor(Math.random() * 5000));
    }, []);

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!input.trim()) return; // Don't send empty messages

        await fetch('http://localhost:9000/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: input,
                sender: user?.displayName || 'Unknown User', // Use real Google name
            })
        });

        setInput(""); // Clear the input after sending
    };

    const deleteMessage = async (id) => {
        try {
            await fetch(`http://localhost:9000/messages/${id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    return(
        <div className="chat">
            <div className="chat__header">
                <Avatar src={`https://robohash.org/${seed}?size=150x150`} />
                <div className="chat__headerInfo">
                    <h3>Room Name</h3>
                    <p>Last seen...</p>
                </div>
                <div className="chat__headerRight">
                    <IconButton>
                        <SearchOutlined />
                    </IconButton>
                    <IconButton>
                        <AttachFile />
                    </IconButton>
                    <IconButton>
                        <MoreVert />
                    </IconButton>
                </div>
            </div>
            <div className="chat__body">
                {messages.map((message) => (
                    <p key={message._id} className={`chat__message ${message.sender === user?.displayName && "chat__receiver"}`}>
                        <span className="chat__name">{message.sender}</span>
                        {message.text}
                        <span className="chat__timestamp">
                            {new Date(message.createdAt).toUTCString()}
                        </span>
                        {message.sender === user?.displayName && (
                            <span onClick={() => deleteMessage(message._id)} style={{ cursor: "pointer", marginLeft: "10px", verticalAlign: "middle", fontSize: "16px" }}>
                                🗑️
                            </span>
                        )}
                    </p>
                ))}
                {/* Dummy div to scroll into view */}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat__footer">
                <IconButton>
                    <InsertEmoticon />
                </IconButton>
                <form>
                    <input 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        type="text" 
                        placeholder="Type a message" 
                    />
                    <button onClick={sendMessage} type="submit">Send</button>
                </form>
                <IconButton>
                    <MicRounded />
                </IconButton>
            </div>
        </div>
    )
}
export default Chat;
