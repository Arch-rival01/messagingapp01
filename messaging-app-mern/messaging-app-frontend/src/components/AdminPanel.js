import React, { useState, useEffect } from 'react';
import { Avatar, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Delete, ArrowBack, Block, CheckCircle, Visibility, Group, Message as MessageIcon, Today, CellWifi } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStateValue } from '../StateProvider';
import { auth } from '../firebase';

const AdminPanel = () => {
    const [{ user }] = useStateValue();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [suspendingId, setSuspendingId] = useState(null);
    
    // Analytics state
    const [analytics, setAnalytics] = useState({ totalUsers: 0, totalMessages: 0, messagesToday: 0, onlineNow: 0 });
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    
    // Moderation state
    const [modModalOpen, setModModalOpen] = useState(false);
    const [modUser, setModUser] = useState(null);
    const [modMessages, setModMessages] = useState([]);
    const [loadingMod, setLoadingMod] = useState(false);

    const navigate = useNavigate();
    const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;

    useEffect(() => {
        if (user && user.email !== adminEmail) {
            navigate('/');
        }
    }, [user, navigate, adminEmail]);

    useEffect(() => {
        const fetchAdminData = async () => {
            if (user && auth.currentUser && user.email === adminEmail) {
                try {
                    const token = await auth.currentUser.getIdToken();
                    
                    // Fetch users
                    const userRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/users`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const userData = await userRes.json();
                    setUsers(userData);
                    setLoading(false);

                    // Fetch analytics
                    const analyticsRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/admin/analytics`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const analyticsData = await analyticsRes.json();
                    setAnalytics(analyticsData);
                    setLoadingAnalytics(false);

                } catch (error) {
                    console.error("Error fetching admin data:", error);
                }
            }
        };
        fetchAdminData();
    }, [user, adminEmail]);

    const handleDeleteUser = async (uid) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        
        setDeletingId(uid);
        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/users/${uid}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            if (result.success) {
                setUsers(users.filter(u => u.uid !== uid));
            } else {
                alert("Failed to delete user: " + result.error);
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error deleting user.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleSuspend = async (uid, currentStatus) => {
        setSuspendingId(uid);
        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/admin/users/${uid}/suspend`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const updatedUser = await response.json();
            setUsers(users.map(u => u.uid === uid ? { ...u, isSuspended: updatedUser.isSuspended } : u));
        } catch (error) {
            console.error("Error toggling suspend:", error);
            alert("Error toggling suspension status.");
        } finally {
            setSuspendingId(null);
        }
    };

    const handleOpenModeration = async (targetUser) => {
        setModUser(targetUser);
        setModModalOpen(true);
        setLoadingMod(true);
        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/admin/users/${targetUser.uid}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setModMessages(data);
        } catch (error) {
            console.error("Error fetching user messages:", error);
        } finally {
            setLoadingMod(false);
        }
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm("Delete this message globally?")) return;
        try {
            const token = await auth.currentUser.getIdToken();
            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9000'}/messages/${msgId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setModMessages(modMessages.filter(m => m._id !== msgId));
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    if (user?.email !== adminEmail) return null;

    // A sleek generic stat card component
    const StatCard = ({ title, value, icon, loading }) => (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <div className="text-slate-400">{icon}</div>
            </div>
            {loading ? (
                <CircularProgress size={24} sx={{ color: '#94a3b8' }} />
            ) : (
                <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
            )}
        </div>
    );

    return (
        <div className="flex flex-col flex-1 h-full bg-slate-50 relative">
            {/* Header */}
            <div className="flex items-center p-4 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <IconButton onClick={() => navigate('/')} className="!mr-2">
                    <ArrowBack />
                </IconButton>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    {/* Analytics Section */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4">System Overview</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Total Users" value={analytics.totalUsers} icon={<Group />} loading={loadingAnalytics} />
                            <StatCard title="Total Messages" value={analytics.totalMessages} icon={<MessageIcon />} loading={loadingAnalytics} />
                            <StatCard title="Messages Today" value={analytics.messagesToday} icon={<Today />} loading={loadingAnalytics} />
                            <StatCard title="Online Now" value={analytics.onlineNow} icon={<CellWifi />} loading={loadingAnalytics} />
                        </div>
                    </div>

                    {/* Users Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Manage Users</h2>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-12">
                                <CircularProgress sx={{ color: '#94a3b8' }} />
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                {users.map((u, index) => (
                                    <div 
                                        key={u.uid} 
                                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors ${
                                            index !== users.length - 1 ? 'border-b border-slate-100' : ''
                                        }`}
                                    >
                                        <div className="flex items-center space-x-4 mb-4 sm:mb-0 overflow-hidden">
                                            <Avatar src={u.photoURL} alt={u.name} sx={{ width: 48, height: 48 }} className={`border shadow-sm ${u.isSuspended ? 'opacity-50 grayscale' : ''}`} />
                                            <div className="overflow-hidden">
                                                <h3 className="font-semibold text-slate-800 truncate flex items-center">
                                                    {u.name} {u.uid === user.uid && '(You)'}
                                                    {u.isSuspended && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Suspended</span>}
                                                </h3>
                                                <p className="text-sm text-slate-500 truncate">{u.email}</p>
                                            </div>
                                        </div>
                                        
                                        {u.uid !== user.uid && (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleOpenModeration(u)}
                                                    className="flex items-center justify-center px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-all font-medium text-sm"
                                                    title="Moderate User Messages"
                                                >
                                                    <Visibility fontSize="small" className="mr-1.5" /> Mod
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleToggleSuspend(u.uid, u.isSuspended)}
                                                    disabled={suspendingId === u.uid}
                                                    className={`flex items-center justify-center px-3 py-1.5 rounded-lg transition-all font-medium text-sm disabled:opacity-50 ${
                                                        u.isSuspended 
                                                        ? 'text-emerald-600 hover:bg-emerald-50' 
                                                        : 'text-amber-600 hover:bg-amber-50'
                                                    }`}
                                                >
                                                    {suspendingId === u.uid ? (
                                                        <CircularProgress size={16} color="inherit" />
                                                    ) : u.isSuspended ? (
                                                        <><CheckCircle fontSize="small" className="mr-1.5" /> Unsuspend</>
                                                    ) : (
                                                        <><Block fontSize="small" className="mr-1.5" /> Suspend</>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteUser(u.uid)}
                                                    disabled={deletingId === u.uid}
                                                    className="flex items-center justify-center px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all font-medium text-sm disabled:opacity-50"
                                                >
                                                    {deletingId === u.uid ? (
                                                        <CircularProgress size={16} color="inherit" />
                                                    ) : (
                                                        <><Delete fontSize="small" className="mr-1.5" /> Delete</>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Moderation Modal */}
            <Dialog 
                open={modModalOpen} 
                onClose={() => setModModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="border-b border-slate-100 font-bold text-slate-800">
                    Moderating: {modUser?.name}
                </DialogTitle>
                <DialogContent className="p-0 bg-slate-50 min-h-[300px]">
                    {loadingMod ? (
                        <div className="flex justify-center items-center h-[300px]">
                            <CircularProgress sx={{ color: '#94a3b8' }} />
                        </div>
                    ) : modMessages.length === 0 ? (
                        <div className="flex justify-center items-center h-[300px] text-slate-400">
                            No recent messages found.
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {modMessages.map(msg => (
                                <div key={msg._id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                                        <IconButton size="small" onClick={() => handleDeleteMessage(msg._id)} className="!text-rose-400 hover:!bg-rose-50">
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </div>
                                    {msg.text && <p className="text-slate-800 text-sm mb-2">{msg.text}</p>}
                                    {msg.mediaUrl && msg.mediaType === 'image' && (
                                        <img src={msg.mediaUrl} alt="media" className="rounded-lg max-h-40 object-cover" />
                                    )}
                                    {msg.mediaUrl && msg.mediaType === 'video' && (
                                        <video src={msg.mediaUrl} controls className="rounded-lg max-h-40" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
                <DialogActions className="border-t border-slate-100 p-3">
                    <Button onClick={() => setModModalOpen(false)} sx={{ color: '#64748b' }}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AdminPanel;
