import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  User as UserIcon,
  Loader2,
  Clapperboard,
  Languages,
  Film,
  UserPlus,
  Check,
  MessageSquare,
  Clock,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const GENRE_MAP = {
  28: 'Action',
  35: 'Comedy',
  18: 'Drama',
  27: 'Horror',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  16: 'Animation',
  99: 'Documentary',
  12: 'Adventure',
  14: 'Fantasy',
  9648: 'Mystery'
};

const LANG_MAP = {
  'ml': 'Malayalam',
  'en': 'English',
  'ta': 'Tamil',
  'te': 'Telugu',
  'kn': 'Kannada',
  'hi': 'Hindi',
  'or': 'Other'
};

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/profile/${id}`);
      setProfile(response.data);
    } catch (error) {
      toast.error('Failed to load profile');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      await api.post('/connections/request', { recipientId: id });
      toast.success('Connection request sent!');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold-text animate-spin" />
      </div>
    );
  }

  const { user, connectionStatus, stats } = profile;

  const Section = ({ title, icon: Icon, items }) => (
    <div className="glass-card mb-8">
      <div className="flex items-center gap-4 p-6 border-b border-white/5 bg-white/5">
        <div className="w-10 h-10 rounded-full bg-gold-text/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-gold-text" />
        </div>
        <h3 className="text-lg font-black uppercase tracking-tight text-white">{title}</h3>
      </div>
      <div className="p-4 md:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {items?.map((item, idx) => {
          let name = item.name || item.title || item;
          let image = item.profilePath || item.posterPath ? `https://image.tmdb.org/t/p/w185${item.profilePath || item.posterPath}` : null;

          return (
            <div key={idx} className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden aspect-[4/5] hover:border-gold-text/50 transition-all duration-300 group">
              {image ? (
                <img src={image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 text-center">
                  <span className="text-sm font-black gold-text uppercase leading-tight">{name}</span>
                </div>
              )}
            </div>
          );
        })}
        {(!items || items.length === 0) && (
          <div className="col-span-full py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10 opacity-30">
            <p className="text-gray-500 text-xs italic uppercase tracking-widest">Nothing shared</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="pt-24 min-h-screen bg-black text-white px-4 md:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <div className="w-full md:w-1/3">
            <div className="glass-card p-8 border-gold-text/20 text-center sticky top-24">
              <div className="w-32 h-32 rounded-full bg-gold-text flex items-center justify-center text-black text-5xl font-black mx-auto mb-6 shadow-[0_0_40px_rgba(255,215,0,0.3)] select-none overflow-hidden">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.[0]?.toUpperCase() || <UserIcon className="w-12 h-12" />
                )}
              </div>
              <h2 className="text-3xl font-black gold-text mb-1">{user.name}</h2>
              <p className="text-sm gold-text/80 font-bold uppercase tracking-widest mb-1">@{user.characterName}</p>
              <p className="text-gray-500 text-xs mb-8">{user.email}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-2xl font-black gold-text">{stats.connections}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest items-center flex justify-center gap-1 mt-1 font-bold">
                    <UserPlus className="w-3 h-3" /> Connections
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-2xl font-black gold-text">{stats.discussions}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest items-center flex justify-center gap-1 mt-1 font-bold">
                    <MessageSquare className="w-3 h-3" /> Discussions
                  </p>
                </div>
              </div>

              {connectionStatus === 'none' && (
                <button
                  onClick={handleConnect}
                  disabled={actionLoading}
                  className="w-full py-4 bg-gold-text text-black rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(255,215,0,0.2)] disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Add Connection</>}
                </button>
              )}
              {connectionStatus === 'pending' && (
                <div className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-black uppercase tracking-widest text-gray-500 flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" /> Connection Pending
                </div>
              )}
              {connectionStatus === 'accepted' && (
                <div className="w-full py-4 bg-green-500/10 border border-green-500/20 rounded-xl font-black uppercase tracking-widest text-green-500 flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> Already Connected
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="w-full md:w-2/3">
            <Section title="Favorite Genres" icon={Clapperboard} items={user.selectedGenres?.map(id => GENRE_MAP[id] || id)} />
            <Section title="Preferred Languages" icon={Languages} items={user.selectedLanguages?.map(code => LANG_MAP[code] || code)} />
            <Section title="Favorite Directors" icon={UserIcon} items={user.favoriteDirectors} />
            <Section title="Favorite Movies" icon={Film} items={user.favoriteMovies} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default PublicProfile;
