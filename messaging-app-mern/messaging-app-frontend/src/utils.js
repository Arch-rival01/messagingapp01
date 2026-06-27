export const formatTimestamp = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
                    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear();
                        
    if (isToday) {
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else if (isYesterday) {
        return "Yesterday";
    } else {
        return date.toLocaleDateString();
    }
};
