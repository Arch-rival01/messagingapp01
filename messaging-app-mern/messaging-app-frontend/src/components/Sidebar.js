import React from 'react';
import './Sidebar.css';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import ChatIcon from '@mui/icons-material/Chat';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Avatar, IconButton } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import Sidebarchat from './Sidebarchat';


const Sidebar = () => {
    return(
        <div className="sidebar">    
        <div className="sidebar__header">
            <Avatar src="https://i.pravatar.cc/150?img=3" />
            <div className="sidebar__headerRight">
                <IconButton>
                    <DonutLargeIcon />
                </IconButton>
                <IconButton>
                    <ChatIcon />
                </IconButton>
                <IconButton>
                    <MoreVertIcon />
                </IconButton>
            </div>
             </div>
         <div className="sidebar__search"> 
                <div className="sidebar__searchContainer">
                    <SearchOutlinedIcon />
                    <input placeholder="Search or start new chat" type="text" />
                </div>
         </div>
          <div className="sidebar__chats">
            <Sidebarchat />
            <Sidebarchat />
            <Sidebarchat />
             </div>

      </div>    
    )
}
export default Sidebar;
