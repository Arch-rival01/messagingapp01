import React, {useEffect , useState} from 'react';
import { Avatar } from '@mui/material';
import './Sidebarchat.css';

const SidebarChat = () => {
    const [seed, setSeed] = useState('')
    useEffect(() => {
        setSeed(Math.floor(Math.random() * 5000))
    }, [])
    return(
        <div className="sidebarChat">
            <Avatar src={`https://robohash.org/${seed}?size=150x150`} />
            <div className="sidebarChat__info">
                <h2>Room Name</h2>
                <p>Last message</p>
            </div>
        </div>
    )
}
export default SidebarChat;