import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  User as UserIcon, 
  Settings, 
  Trash2, 
  Plus, 
  Loader2, 
  Search, 
  ChevronRight, 
  Bookmark, 
  CheckCircle,
  Clapperboard,
  Languages,
  Film,
  Users,
  MessageSquare,
  X,
  Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageCropper from '../components/ImageCropper';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
  { id: 12, name: 'Adventure' },
  { id: 14, name: 'Fantasy' },
  { id: 9648, name: 'Mystery' }
];

const LANGUAGES = [
  { id: 'ml', name: 'Malayalam' },
  { id: 'en', name: 'English' },
  { id: 'ta', name: 'Tamil' },
  { id: 'te', name: 'Telugu' },
  { id: 'kn', name: 'Kannada' },
  { id: 'hi', name: 'Hindi' },
  { id: 'or', name: 'Other' }
];

const Profile = () => {
  const { user, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [showConnectionsList, setShowConnectionsList] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  const watchlistCount = user?.watchlist?.filter(m => m.status === 'pending').length || 0;
  const watchedCount = user?.watchlist?.filter(m => m.status === 'watched').length || 0;

  useEffect(() => {
    const fetchExtraData = async () => {
      try {
        const [connRes, discRes] = await Promise.all([
          api.get('/connections/my-connections'),
          api.get('/discussions/my-discussions')
        ]);
        setConnections(connRes.data);
        setDiscussions(discRes.data);
      } catch (error) {
        console.error('Failed to fetch profile data');
      }
    };
    if (user) fetchExtraData();
  }, [user]);

  const handleDeleteDiscussion = async (id) => {
    if (window.confirm('Delete this discussion for everyone?')) {
      try {
        await api.delete(`/discussions/${id}`);
        setDiscussions(prev => prev.filter(d => d._id !== id));
        toast.success('Discussion deleted');
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const handleUpdate = async (updatedData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/update-profile', updatedData);
      setUser(response.data.user);
      toast.success('Profile updated!');
    } catch (error) {
      // Expose the raw error string to the user toast directly
      toast.error(error?.response?.data?.message || error?.message || 'Update failed');
    } finally {
      setLoading(false);
      setEditingField(null);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const removeItem = (field, id) => {
    let updatedItems;
    if (field === 'selectedGenres' || field === 'selectedLanguages') {
      updatedItems = user[field].filter(item => item !== id.toString());
    } else {
      updatedItems = user[field].filter(item => item.id !== id);
    }
    handleUpdate({ [field]: updatedItems });
  };

  const searchTMDB = async (query, type) => {
    if (!query) return;
    setSearchLoading(true);
    try {
      const endpoint = type === 'director' ? '/movies/search/person' : '/movies/search';
      const response = await api.get(`${endpoint}?query=${encodeURIComponent(query)}`);
      let results = response.data;
      if (type === 'director') {
        results = results.filter(p => p.known_for_department === 'Directing');
      }
      setSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const addItem = (field, item) => {
    let newItem;
    if (field === 'favoriteDirectors') {
      newItem = { id: item.id, name: item.name, profilePath: item.profile_path };
    } else if (field === 'favoriteMovies') {
      newItem = { id: item.id, title: item.title, posterPath: item.poster_path };
    } else {
      newItem = item;
    }

    const currentItems = user[field] || [];
    if (field === 'selectedGenres' || field === 'selectedLanguages') {
      const newItemId = newItem.toString();
      if (currentItems.includes(newItemId)) return;
      handleUpdate({ [field]: [...currentItems, newItemId] });
    } else {
      if (currentItems.find(i => i.id === newItem.id)) return;
      handleUpdate({ [field]: [...currentItems, newItem] });
    }
  };

  const Section = ({ title, icon: Icon, field, items, isSearchable = false }) => {
    const isExpanded = editingField === field;

    return (
      <div className={`glass-card border-white/5 mb-6 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-gold-text/30' : ''}`}>
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setEditingField(isExpanded ? null : field)}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gold-text/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-gold-text" />
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase tracking-tight text-white">{title}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">{items?.length || 0} selected</p>
            </div>
          </div>
          <button className="text-gold-text p-2 hover:bg-gold-text/10 rounded-full transition-colors">
            {isExpanded ? <Plus className="w-6 h-6 rotate-45 transition-transform" /> : <Plus className="w-6 h-6 transition-transform" />}
          </button>
        </div>

        <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="p-6 pt-0 border-t border-white/5">
            {isSearchable ? (
              <div className="mb-6 relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder={`Search to add ${title}...`}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 focus:border-gold-text outline-none text-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchTMDB(e.target.value, field === 'favoriteDirectors' ? 'director' : 'movie');
                  }}
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-black/95 border border-white/10 rounded-lg overflow-hidden z-20 shadow-2xl backdrop-blur-xl">
                    {searchResults.map(res => (
                      <button 
                        key={res.id}
                        onClick={() => addItem(field, res)}
                        className="w-full text-left p-3 hover:bg-white/10 flex items-center gap-3 border-b border-white/5 last:border-none group"
                      >
                        <img 
                          src={res.profile_path || res.poster_path ? `https://image.tmdb.org/t/p/w92${res.profile_path || res.poster_path}` : 'https://placehold.co/92x138/1a1a1a/ffd700?text=N/A'} 
                          className="w-8 h-10 object-cover rounded shadow-sm" 
                          alt={res.name || res.title}
                        />
                        <span className="text-sm font-medium group-hover:text-gold-text transition-colors">{res.name || res.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 mt-4 flex flex-wrap gap-2">
                {(field === 'selectedGenres' ? GENRES : LANGUAGES).map(option => {
                  const isSelected = field === 'selectedGenres' 
                    ? user?.selectedGenres?.includes(option.id.toString())
                    : user?.selectedLanguages?.includes(option.id.toString());
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => isSelected ? removeItem(field, option.id) : addItem(field, option.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                        isSelected 
                          ? 'bg-gold-text text-black border-gold-text shadow-lg' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-gold-text/50 hover:text-white'
                      }`}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            )}

            {!['selectedGenres', 'selectedLanguages'].includes(field) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {items?.map((item, idx) => {
                  let name = item.name || item.title || item;
                  let image = null;

                  if (field === 'selectedGenres') {
                    name = GENRES.find(g => g.id == item)?.name || item;
                  } else if (field === 'selectedLanguages') {
                    name = LANGUAGES.find(l => l.id == item)?.name || item;
                  } else if (field === 'favoriteDirectors') {
                    image = item.profilePath ? `https://image.tmdb.org/t/p/w185${item.profilePath}` : null;
                  } else if (field === 'favoriteMovies') {
                    image = item.posterPath ? `https://image.tmdb.org/t/p/w185${item.posterPath}` : null;
                  }

                  return (
                    <div key={idx} className="relative group bg-white/5 border border-white/10 rounded-xl overflow-hidden aspect-[4/5] hover:border-gold-text/50 transition-all duration-300">
                      {image ? (
                        <img src={image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center">
                          <span className="text-sm font-black gold-text uppercase leading-tight">{name}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs font-bold text-white mb-4 line-clamp-2 uppercase">{name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(field, item.id || item);
                          }}
                          className="bg-red-500/20 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {(!items || items.length === 0) && (
                  <div className="col-span-full py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                    <p className="text-gray-600 text-sm italic tracking-widest uppercase">Nothing added yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold-text animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center px-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in to view your profile</h2>
          <button onClick={() => navigate('/signin')} className="px-6 py-2 bg-gold-text text-black rounded-full font-bold uppercase text-sm">Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <main className="pt-24 min-h-screen bg-black text-white px-4 md:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Column: Account Details */}
          <div className="w-full md:w-1/3">
            <div className="glass-card p-8 border-gold-text/20 text-center sticky top-24">
              <div className="relative group mx-auto mb-6 w-32 h-32">
                <div className="w-32 h-32 rounded-full bg-gold-text flex items-center justify-center text-black text-5xl font-black shadow-[0_0_40px_rgba(255,215,0,0.2)] overflow-hidden">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || <UserIcon className="w-12 h-12" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error('Image size must be less than 2MB');
                          e.target.value = ''; // Reset
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => setCropImageSrc(reader.result);
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }
                    }} 
                  />
                </label>
              </div>
              <h2 className="text-3xl font-black gold-text mb-1">{user?.name}</h2>
              <p className="text-sm gold-text/80 font-bold uppercase tracking-widest mb-1">@{user?.characterName}</p>
              <p className="text-gray-500 mb-8">{user?.email}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button 
                    onClick={() => setShowConnectionsList(true)}
                    className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors group relative"
                  >
                    <p className="text-2xl font-black gold-text">{connections.length}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 group-hover:text-white font-bold">Connections</p>
                    <div 
                      onClick={(e) => { e.stopPropagation(); navigate('/find-people'); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-gold-text text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <p className="text-2xl font-black gold-text">{discussions.length}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">Groups</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={() => navigate('/watchlist?status=pending')}
                    className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <p className="text-2xl font-black gold-text">{watchlistCount}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 group-hover:text-white font-bold">Watchlist</p>
                  </button>
                  <button 
                    onClick={() => navigate('/watchlist?status=watched')}
                    className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <p className="text-2xl font-black gold-text">{watchedCount}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 group-hover:text-white font-bold">Watched</p>
                  </button>
                </div>

              <div className="pt-6 border-t border-white/5 text-left">
                <div className="flex items-center justify-between text-sm text-gray-400 hover:text-white cursor-pointer group mb-2">
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preferences */}
          <div className="w-full md:w-2/3">
            <div className="mb-12">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                 <h2 className="text-3xl md:text-4xl font-black uppercase gold-text tracking-tighter">Your Discussions</h2>
                 <button onClick={() => navigate('/create-discussion')} className="px-6 py-2 bg-gold-text text-black rounded-full font-black uppercase text-xs hover:scale-105 transition-all">Start New</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {discussions.map(disc => (
                   <div key={disc._id} className="glass-card overflow-hidden group hover:border-gold-text/30 transition-all">
                      <div className="relative h-32 w-full">
                         <img src={disc.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-60" alt="backdrop" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                         <div className="absolute bottom-4 left-4 flex gap-4 items-end">
                            <img src={disc.movie.posterPath ? `https://image.tmdb.org/t/p/w92${disc.movie.posterPath}` : 'https://placehold.co/92x138/1a1a1a/ffd700?text=No+Img'} className="w-12 h-18 object-cover rounded shadow-2xl border border-white/10" alt="poster" />
                            <div className="pb-1">
                               <p className="text-xs font-black gold-text truncate w-40">{disc.movie.title}</p>
                               <p className="text-[10px] text-white font-bold truncate w-40">{disc.caption}</p>
                            </div>
                         </div>
                         {disc.creator === user.id && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteDiscussion(disc._id); }}
                             className="absolute top-4 right-4 p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                      <div className="p-4 flex justify-between items-center bg-white/5">
                         <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{disc.participants.length} Joined</span>
                         </div>
                         <button 
                           onClick={() => navigate(`/discussion/${disc._id}`)}
                           className="text-[10px] font-black uppercase tracking-widest gold-text hover:underline"
                         >
                           Enter Room
                         </button>
                      </div>
                   </div>
                 ))}
                 {discussions.length === 0 && (
                   <div className="col-span-full py-20 text-center glass-card border-dashed opacity-30">
                      <MessageSquare className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs italic uppercase tracking-widest">No active discussions</p>
                   </div>
                 )}
               </div>
            </div>

            <h1 className="text-4xl font-black uppercase mb-8 gold-text tracking-tighter">Preferences</h1>
            
            <Section title="Favorite Genres" icon={Clapperboard} field="selectedGenres" items={user?.selectedGenres} />
            <Section title="Preferred Languages" icon={Languages} field="selectedLanguages" items={user?.selectedLanguages} />
            <Section title="Favorite Directors" icon={UserIcon} field="favoriteDirectors" items={user?.favoriteDirectors} isSearchable />
            <Section title="Favorite Movies" icon={Film} field="favoriteMovies" items={user?.favoriteMovies} isSearchable />

            {loading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <Loader2 className="w-12 h-12 text-gold-text animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
      {showConnectionsList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 bg-black animate-in fade-in duration-300">
           <div className="w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[80vh] bg-black sm:bg-[#0a0a0a] border border-white/10 flex flex-col rounded-none sm:rounded-[2rem]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                 <h2 className="text-2xl font-black uppercase tracking-tighter gold-text">Your Connections</h2>
                 <button onClick={() => setShowConnectionsList(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                 {connections.map(connUser => (
                   <div key={connUser._id} onClick={() => { setShowConnectionsList(false); navigate(`/user/${connUser._id}`); }} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-4 hover:border-gold-text/40 transition-all group cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-gold-text flex items-center justify-center text-black font-black text-xl overflow-hidden shadow-lg border-2 border-white/5">
                        {connUser.profileImage ? (
                          <img src={connUser.profileImage} alt={connUser.name} className="w-full h-full object-cover" />
                        ) : (
                          connUser.name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                         <p className="font-bold gold-text group-hover:underline">@{connUser.characterName}</p>
                         <p className="text-[10px] text-gray-500 uppercase font-black">{connUser.name}</p>
                      </div>
                   </div>
                 ))}
                 {connections.length === 0 && (
                   <div className="text-center py-12 opacity-30">
                      <Users className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-xs italic uppercase tracking-widest font-black">Find some movie buffs first</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={(croppedBase64) => {
            handleUpdate({ profileImage: croppedBase64 });
            setCropImageSrc(null);
          }}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </main>
  );
};

export default Profile;
