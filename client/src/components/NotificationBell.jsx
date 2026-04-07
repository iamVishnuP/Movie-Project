import React, { useState, useEffect, useRef } from 'react';
import { Bell, UserPlus, MessageSquare, Check, X, Clock } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const NotificationBell = ({ forceShow = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRespond = async (n, status) => {
    try {
      if (n.type === 'connection_request') {
        await api.put(`/connections/respond/${n.referenceId}`, { status });
      } else if (n.type === 'discussion_invite') {
        await api.put(`/discussions/respond/${n.referenceId}`, { status });
      }
      toast.success(`Request ${status}`);
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to respond to request');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/mark-read/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  return (
    <div className={`relative ${forceShow ? 'block' : (unreadCount === 0 ? 'hidden sm:block' : 'block')}`} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-gold-text' : 'text-gray-400'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-20 sm:top-full left-4 right-4 sm:left-auto sm:right-0 sm:w-80 bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[100]">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black">
            <h3 className="font-black uppercase tracking-tighter text-sm gold-text">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={async () => {
                   await api.put('/notifications/mark-all-read');
                   fetchNotifications();
                }}
                className="text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-transparent">
                <Bell className="w-10 h-10 text-gray-800 mx-auto mb-2 opacity-20" />
                <p className="text-gray-600 text-xs italic uppercase tracking-widest">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n._id} 
                  className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors relative ${!n.read ? 'bg-gold-text/[0.03]' : ''}`}
                  onClick={() => !n.read && markAsRead(n._id)}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center">
                      {n.type === 'connection_request' ? <UserPlus className="w-5 h-5 text-blue-400" /> : <MessageSquare className="w-5 h-5 text-gold-text" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white">
                        <span className="font-bold gold-text">@{n.sender?.characterName}</span> {n.message}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt).toLocaleDateString()}
                      </div>

                      {!n.read && (n.type === 'connection_request' || n.type === 'discussion_invite') && (
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRespond(n, 'accepted'); }}
                            className="flex-1 py-1.5 bg-gold-text text-black rounded font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Accept
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRespond(n, 'rejected'); }}
                            className="flex-1 py-1.5 bg-white/10 text-white rounded font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all flex items-center justify-center gap-1"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
