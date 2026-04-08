import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Loader2,
  Send,
  MessageSquare,
  CornerDownRight,
  ThumbsUp,
  Heart,
  Smile,
  Clock,
  User,
  ImageIcon,
  X,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '💧', '🥹'];

const DiscussionThread = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const response = await api.get(`/discussions/${id}`);
      setData(response.data);
      // Mark as read locally for dynamic badge
      localStorage.setItem(`disc_${id}`, new Date().toISOString());
    } catch (error) {
      toast.error('Failed to load discussion');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Polling every 3s
    return () => clearInterval(interval);
  }, [id]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedImage) return;

    setSending(true);
    try {
      await api.post('/discussions/post', {
        discussionId: id,
        text: message,
        imageUrl: selectedImage,
        parentPostId: replyTo?._id
      });
      setMessage('');
      setSelectedImage(null);
      setReplyTo(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to post message');
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (postId, emoji) => {
    try {
      await api.post('/discussions/react', { postId, emoji });
      fetchData();
    } catch (error) {
      console.error('Failed to react');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this discussion?')) return;

    try {
      await api.post(`/discussions/leave/${id}`);
      toast.success('Left discussion');
      navigate('/');
    } catch (error) {
      toast.error('Failed to leave discussion');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-12 h-12 text-gold-text animate-spin" /></div>;

  const { discussion, posts, isParticipant } = data;

  const renderPost = (post, isReply = false) => (
    <div key={post._id} className={`${isReply ? 'ml-4 md:ml-12 border-l-2 border-white/5 pl-4 md:pl-6 mt-4' : 'glass-card p-4 md:p-6 mb-6'} group animate-in slide-in-from-bottom-2 duration-300`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black gold-text uppercase select-none border border-white/10 overflow-hidden">
            {post.author?.profileImage ? (
              <img src={post.author.profileImage} alt={post.author.name} className="w-full h-full object-cover" />
            ) : (
              post.author?.name?.[0]
            )}
          </div>
          <div>
            <p className="text-xs font-black gold-text uppercase tracking-tight">@{post.author?.characterName}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        {isParticipant && !isReply && (
          <button
            onClick={() => setReplyTo(post)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gold-text flex items-center gap-1"
          >
            <CornerDownRight className="w-3 h-3" /> Reply
          </button>
        )}
      </div>

      <p className="text-gray-200 text-sm leading-relaxed font-medium">{post.text}</p>

      {post.imageUrl && <img src={post.imageUrl} className="mt-4 rounded-xl max-h-60 object-contain bg-white/5 border border-white/10" alt="post" />}

      <div className="flex flex-wrap gap-2 mt-4">
        {REACTION_EMOJIS.map(emoji => {
          const count = post.reactions?.filter(r => r.emoji === emoji).length || 0;
          return (
            <button
              key={emoji}
              onClick={() => isParticipant && handleReact(post._id, emoji)}
              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all border ${count > 0 ? 'bg-gold-text/20 border-gold-text/50 text-gold-text' : 'bg-white/5 border-white/5 text-gray-600 hover:border-white/20'}`}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="font-bold">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Render nested replies */}
      {posts.filter(p => p.parentPostId === post._id).map(reply => renderPost(reply, true))}
    </div>
  );

  return (
    <main className="pt-24 min-h-screen bg-black text-white px-6 pb-40">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="glass-card overflow-hidden mb-12 border-gold-text/10">
          <div className="relative h-60 w-full overflow-hidden">
            <img src={discussion.image} className="w-full h-full object-cover blur-sm opacity-50 scale-110" alt="backdrop" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

            {isParticipant && (
              <div className="absolute top-4 right-4 md:top-6 md:right-8 z-10">
                <button
                  onClick={handleLeave}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <LogOut className="w-3 h-3" /> Exit Room
                </button>
              </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-8 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-end">
              <img src={discussion.movie.posterPath ? `https://image.tmdb.org/t/p/w185${discussion.movie.posterPath}` : 'https://placehold.co/185x278/1a1a1a/ffd700?text=No+Img'} className="w-20 h-28 md:w-24 md:h-36 object-cover rounded-xl shadow-2xl border-2 border-white/10" alt="poster" />
              <div className="flex-1 pb-2">
                <h1 className="text-2xl md:text-4xl font-black tracking-tighter gold-text leading-none mb-2">{discussion.movie.title}</h1>
                <p className="text-xs md:text-sm font-bold text-white mb-2 line-clamp-2 md:line-clamp-none max-w-2xl">{discussion.caption}</p>
                <div className="flex gap-4">
                  <div className="flex -space-x-3">
                    {discussion.participants.slice(0, 5).map(p => (
                      <div key={p._id} className="w-8 h-8 rounded-full bg-gold-text border-2 border-black flex items-center justify-center text-black font-black text-[10px] uppercase shadow-lg overflow-hidden">
                        {p.profileImage ? (
                          <img src={p.profileImage} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          p.name?.[0]
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-2">{discussion.participants.length} Participants</p>
                </div>
              </div>
            </div>
          </div>
          {/* Detailed Thoughts Section */}
          <div className="px-6 py-4 md:px-8 md:py-6 border-t border-white/5 bg-white/[0.02]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Detailed Analysis</p>
            <p className="text-sm text-gray-300 leading-relaxed italic">"{discussion.thoughts}"</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-white/10 flex-1"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">Timeline Start</p>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {posts.filter(p => !p.parentPostId).map(post => renderPost(post))}

          <div className="flex items-center gap-4 py-8">
            <div className="h-px bg-white/10 flex-1"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">You're caught up</p>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
        </div>

        {/* Input Dock */}
        {isParticipant && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-40">
            {replyTo && (
              <div className="bg-[#1a1a1a] p-3 rounded-t-2xl border-t border-l border-r border-gold-text/30 flex justify-between items-center animate-in slide-in-from-bottom-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gold-text flex items-center gap-2">
                  <CornerDownRight className="w-3 h-3" /> Replying to @{replyTo.author?.characterName}
                </p>
                <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/5 rounded-full"><X className="w-3 h-3" /></button>
              </div>
            )}
            <form onSubmit={handlePost} className={`bg-black/80 backdrop-blur-3xl border ${replyTo ? 'border-gold-text/30 rounded-b-2xl' : 'border-white/10 rounded-2xl'} p-2 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]`}>
              {selectedImage && (
                <div className="p-2 relative w-20 h-20 group">
                   <img src={selectedImage} className="w-full h-full object-cover rounded-lg border border-gold-text/30 shadow-lg" alt="upload" />
                   <button 
                    type="button" 
                    onClick={() => setSelectedImage(null)} 
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                    <X className="w-3 h-3" />
                   </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className={`p-2 rounded-xl transition-all ${selectedImage ? 'text-gold-text bg-gold-text/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="POST YOUR ANALYSIS..."
                  className="flex-1 bg-transparent border-none outline-none py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm font-bold tracking-tight text-white placeholder:text-gray-700"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={(!message.trim() && !selectedImage) || sending}
                  className="w-12 h-12 bg-gold-text text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex-shrink-0"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </main>
  );
};

export default DiscussionThread;
