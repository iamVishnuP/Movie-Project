import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Send, Loader2, ArrowLeft, MessageSquare, User, Clock, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const DirectMessages = () => {
  const { userId } = useParams(); // optional: open a specific conversation
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null); // { otherUser, messages }
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const scrollRef = useRef(null);
  const pollRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingConvs(false); }
  }, []);

  const openConversation = useCallback(async (uid) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/conversation/${uid}`);
      setActiveConv(res.data);
      await fetchConversations(); // Refresh unread counts
    } catch (e) { toast.error('Failed to load messages'); }
    finally { setLoadingMessages(false); }
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // If userId is in URL params, auto-open that conversation
  useEffect(() => {
    if (userId) openConversation(userId);
  }, [userId, openConversation]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages]);

  // Poll for new messages every 3s when conversation is open
  useEffect(() => {
    if (!activeConv) return;
    pollRef.current = setInterval(() => {
      openConversation(activeConv.otherUser._id);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeConv?.otherUser?._id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeConv) return;
    setSending(true);
    const text = message.trim();
    setMessage('');
    try {
      const res = await api.post('/messages/send', {
        recipientId: activeConv.otherUser._id,
        text
      });
      setActiveConv(prev => ({
        ...prev,
        messages: [...(prev.messages || []), res.data]
      }));
      fetchConversations();
    } catch (e) {
      toast.error('Failed to send message');
      setMessage(text);
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter(c =>
    !convSearch.trim() ||
    (c.otherUser?.name || '').toLowerCase().includes(convSearch.toLowerCase()) ||
    (c.otherUser?.characterName || '').toLowerCase().includes(convSearch.toLowerCase())
  );

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <main className="pt-20 min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 max-w-6xl w-full mx-auto px-0 sm:px-4 flex" style={{ height: 'calc(100vh - 5rem)' }}>

        {/* Sidebar: Conversation List */}
        <div className={`${activeConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-white/5`}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gold-text/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-gold-text" />
              </div>
              <h1 className="font-black uppercase tracking-tight text-lg gold-text">Messages</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:border-gold-text focus:outline-none transition-all placeholder:text-gray-600"
                value={convSearch}
                onChange={e => setConvSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold-text animate-spin" /></div>
            ) : filteredConvs.length === 0 ? (
              <div className="py-16 text-center px-4">
                <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">No conversations yet</p>
                <p className="text-gray-700 text-xs mt-1">Visit someone's profile to start a chat</p>
              </div>
            ) : (
              filteredConvs.map(conv => {
                const isActive = activeConv?.otherUser?._id === conv.otherId;
                return (
                  <button
                    key={conv._id}
                    onClick={() => openConversation(conv.otherId)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 transition-all text-left hover:bg-white/5 ${isActive ? 'bg-gold-text/5 border-l-2 border-l-gold-text' : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gold-text flex items-center justify-center text-black font-black text-sm uppercase overflow-hidden border-2 border-gold-text/20">
                        {conv.otherUser?.profileImage
                          ? <img src={conv.otherUser.profileImage} alt="" className="w-full h-full object-cover" />
                          : conv.otherUser?.name?.[0]}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-text text-black text-[9px] font-black rounded-full flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-sm gold-text uppercase truncate">{conv.otherUser?.characterName || conv.otherUser?.name}</p>
                        <span className="text-[10px] text-gray-600 flex-shrink-0 ml-2">{formatDate(conv.lastMessageAt)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                        {conv.lastSenderId === user?.id ? 'You: ' : ''}{conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`${!activeConv && 'hidden md:flex'} flex-1 flex flex-col`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-gold-text/5 border border-gold-text/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-gold-text/30" />
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Select a conversation</p>
              <p className="text-gray-700 text-xs mt-2">Or visit a user's profile to start a new message</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-sm">
                <button
                  onClick={() => setActiveConv(null)}
                  className="md:hidden p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gold-text flex items-center justify-center text-black font-black uppercase overflow-hidden border-2 border-gold-text/20 flex-shrink-0">
                  {activeConv.otherUser?.profileImage
                    ? <img src={activeConv.otherUser.profileImage} alt="" className="w-full h-full object-cover" />
                    : activeConv.otherUser?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black gold-text uppercase tracking-tight truncate">{activeConv.otherUser?.characterName}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold truncate">{activeConv.otherUser?.name}</p>
                </div>
                <button
                  onClick={() => navigate(`/user/${activeConv.otherUser._id}`)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-500 hover:text-gold-text"
                  title="View profile"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold-text animate-spin" /></div>
                ) : activeConv.messages?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">No messages yet</p>
                    <p className="text-gray-700 text-xs mt-1">Say hello! 👋</p>
                  </div>
                ) : (
                  activeConv.messages.map((msg, i) => {
                    const isMine = msg.sender === user?.id;
                    return (
                      <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                        <div className={`max-w-[75%] sm:max-w-[60%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                            isMine
                              ? 'bg-gold-text text-black rounded-br-sm'
                              : 'bg-white/8 text-white border border-white/10 rounded-bl-sm'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-gray-600 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(msg.createdAt)}
                            {isMine && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <div className="px-4 sm:px-6 py-4 border-t border-white/5 bg-black/40 backdrop-blur-sm">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold focus:border-gold-text focus:outline-none transition-all placeholder:text-gray-600"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="w-12 h-12 bg-gold-text text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex-shrink-0"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default DirectMessages;
