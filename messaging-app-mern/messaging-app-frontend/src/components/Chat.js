import React, { useEffect, useState } from 'react';
import './Chat.css';
import { Avatar, IconButton } from '@mui/material';
import { MicRounded, AttachFile, MoreVert, SearchOutlined, InsertEmoticon } from '@mui/icons-material';

const Chat = () => {
    const [seed, setSeed] = useState('')
    useEffect(() => {
        setSeed(Math.floor(Math.random() * 5000))
    }, [])
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
                <p className="chat__message">
                    <span className="chat__name">Sourav</span>
                    This is a message 
                    <span className="chat__timestamp">{new Date().toUTCString()}</span>
                </p>
                  <p className="chat__message chat__receiver">
                    <span className="chat__name">Gourav</span>
                    This is a message back
                    <span className="chat__timestamp">{new Date().toUTCString()}</span>
                </p>
                <p className="chat__message">
                    <span className="chat__name">Sourav</span>
                    This is a message again again
                    <span className="chat__timestamp">{new Date().toUTCString()}</span>
                </p>
            </div>
            <div className="chat__footer">
                <IconButton>
                    <InsertEmoticon />
                </IconButton>
                <form>
                    <input type="text" placeholder="Type a message" />
                    <button type="submit">Send</button>
                </form>
                <IconButton>
                    <MicRounded />
                </IconButton>
            </div>
        </div>
    )
}
export default Chat;
