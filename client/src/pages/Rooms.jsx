import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Globe, Lock, Search, TrendingUp, Users, MessageSquare,
  Flame, Loader2, Clock, Zap
} from 'lucide-react';

const RoomCard = ({ disc, onClick, showScore }) => {
  const isPublic = disc.visibility === 'public';
  const participantCount = (disc.participants || []).length;
  const postCount = disc.postCount || 0;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-gold-text/40 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(255,215,0,0.08)] hover:-translate-y-0.5"
    >
      <div className="aspect-video w-full relative">
        <img
          src={disc.image || `https://image.tmdb.org/t/p/w780${disc.movie?.posterPath}`}
          alt={disc.movie?.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-50"
          onError={e => { e.target.src = 'https://placehold.co/780x438/111/ffd700?text=Room'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            isPublic ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/10 border-white/20 text-gray-400'
          }`}>
            {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isPublic ? 'Public' : 'Private'}
          </div>
          {showScore && disc.trendingScore > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">{disc.trendingScore.toFixed(0)}</span>
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 border border-white/10 rounded-full">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{participantCount}</span>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gold-text/80 mb-1 truncate">{disc.movie?.title}</p>
          <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{disc.caption}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {postCount} posts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Rooms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('yours');
  const [yourRooms, setYourRooms] = useState([]);
  const [trendingRooms, setTrendingRooms] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState({ yours: true, trending: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchYours = async () => {
      try {
        const res = await api.get('/discussions/my-discussions');
        setYourRooms(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(p => ({ ...p, yours: false })); }
    };
    const fetchTrending = async () => {
      try {
        const res = await api.get('/discussions/trending');
        setTrendingRooms(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(p => ({ ...p, trending: false })); }
    };
    fetchYours();
    fetchTrending();
  }, []);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/discussions/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery, handleSearch]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className="pt-20 min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-20 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Title + search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-text/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-gold-text" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter gold-text uppercase">Rooms</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Discussion Hubs</p>
              </div>
            </div>
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search rooms by movie..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:border-gold-text focus:outline-none transition-all placeholder:text-gray-600"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-text animate-spin" />}
            </div>
          </div>

          {/* Tabs */}
          {!isSearching && (
            <div className="flex gap-1 pb-0">
              {[
                { id: 'yours', label: 'Your Rooms', icon: Lock },
                { id: 'trending', label: 'Trending', icon: Flame }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-gold-text text-gold-text'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.id === 'yours' && yourRooms.length > 0 && (
                    <span className="bg-gold-text/20 text-gold-text px-1.5 py-0.5 rounded-full text-[9px]">{yourRooms.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Search Results */}
        {isSearching && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-4 h-4 text-gold-text" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                Results for "<span className="text-white">{searchQuery}</span>"
              </h2>
              {searching && <Loader2 className="w-4 h-4 text-gold-text animate-spin ml-auto" />}
            </div>
            {!searching && searchResults.length === 0 && (
              <div className="py-24 text-center">
                <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">No rooms found for this movie</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(disc => (
                <RoomCard key={disc._id} disc={disc} showScore onClick={() => navigate(`/discussion/${disc._id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Your Rooms Tab */}
        {!isSearching && activeTab === 'yours' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-4 h-4 text-gold-text" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Your Rooms</h2>
            </div>
            {loading.yours ? (
              <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-gold-text animate-spin" /></div>
            ) : yourRooms.length === 0 ? (
              <div className="py-24 text-center glass-card">
                <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 font-bold uppercase tracking-widest text-sm mb-4">You're not in any rooms yet</p>
                <button
                  onClick={() => navigate('/create-discussion')}
                  className="px-6 py-3 bg-gold-text text-black rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all"
                >
                  Create a Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {yourRooms.map(disc => (
                  <RoomCard key={disc._id} disc={disc} onClick={() => navigate(`/discussion/${disc._id}`)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trending Rooms Tab */}
        {!isSearching && activeTab === 'trending' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Trending Public Rooms</h2>
              <span className="ml-auto text-[10px] text-gray-600 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3" /> Updated in real-time
              </span>
            </div>
            {loading.trending ? (
              <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-gold-text animate-spin" /></div>
            ) : trendingRooms.length === 0 ? (
              <div className="py-24 text-center glass-card">
                <Flame className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">No public rooms yet</p>
              </div>
            ) : (
              <>
                {/* Top 3 hero cards */}
                {trendingRooms.slice(0, 3).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {trendingRooms.slice(0, 3).map((disc, i) => (
                      <div key={disc._id} className="relative">
                        {i === 0 && (
                          <div className="absolute -top-3 left-4 z-10 flex items-center gap-1 px-3 py-1 bg-orange-500 rounded-full shadow-lg">
                            <Flame className="w-3 h-3 text-white" />
                            <span className="text-[9px] font-black uppercase text-white tracking-widest">Hottest</span>
                          </div>
                        )}
                        <RoomCard disc={disc} showScore onClick={() => navigate(`/discussion/${disc._id}`)} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingRooms.slice(3).map(disc => (
                    <RoomCard key={disc._id} disc={disc} showScore onClick={() => navigate(`/discussion/${disc._id}`)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Rooms;
