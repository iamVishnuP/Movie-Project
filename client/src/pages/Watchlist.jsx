import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Bookmark, Star, Play, Trash2, CheckCircle, Loader2, Bookmark as BookmarkIcon, Plus, FolderOpen, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Watchlist = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialStatus = searchParams.get('status') || 'pending';
  const { setUser } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatus);

  const [collections, setCollections] = useState([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [expandedCollection, setExpandedCollection] = useState(null);

  const fetchWatchlist = async () => {
    try {
      const response = await api.get('/movies/watchlist');
      setWatchlist(response.data);
    } catch (error) {
      toast.error('Failed to fetch watchlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await api.get('/collections');
      setCollections(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    fetchCollections();
  }, []);

  const removeFromWatchlist = async (movieId) => {
    try {
      const response = await api.delete(`/movies/watchlist/remove/${movieId}`);
      setWatchlist(prev => prev.filter(m => m.movieId !== movieId));
      if (response.data.watchlist) {
        setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      }
      toast.success('Removed from watchlist');
    } catch (error) {
      toast.error('Failed to remove movie');
    }
  };

  const markAsWatched = async (movieId) => {
    try {
      const response = await api.put(`/movies/watchlist/watched/${movieId}`);
      setWatchlist(prev => prev.map(m => m.movieId === movieId ? { ...m, status: 'watched' } : m));
      if (response.data.watchlist) {
        setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      }
      toast.success('Marked as watched');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const rateMovie = async (movieId, rating, reviewText) => {
    try {
      const payload = { rating };
      if (reviewText !== undefined) payload.reviewText = reviewText;
      
      const response = await api.put(`/movies/watchlist/rate/${movieId}`, payload);
      setWatchlist(prev => prev.map(m => m.movieId === movieId ? { 
        ...m, 
        rating, 
        review: reviewText !== undefined ? reviewText : m.review 
      } : m));
      if (response.data.watchlist) {
        setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      }
      toast.success('Rating saved!');
    } catch (error) {
      toast.error('Failed to save rating');
    }
  };

  const removeRating = async (movieId) => {
    try {
      const response = await api.delete(`/movies/watchlist/rate/${movieId}`);
      setWatchlist(prev => prev.map(m => m.movieId === movieId ? { 
        ...m, 
        rating: 0, 
        review: "" 
      } : m));
      if (response.data.watchlist) {
        setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      }
      toast.success('Rating and review removed');
    } catch (error) {
      toast.error('Failed to remove rating');
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      const resp = await api.post('/collections', { name: newCollectionName });
      setCollections([resp.data, ...collections]);
      setShowCollectionModal(false);
      setNewCollectionName('');
      toast.success('Collection created');
    } catch {
      toast.error('Failed to create collection');
    }
  };

  const handleDeleteCollection = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/collections/${id}`);
      setCollections(collections.filter(c => c._id !== id));
      if (expandedCollection?._id === id) setExpandedCollection(null);
      toast.success('Collection deleted');
    } catch {}
  };

  const removeFromCollection = async (colId, movieId) => {
    try {
      const resp = await api.delete(`/collections/${colId}/remove/${movieId}`);
      setCollections(collections.map(c => c._id === colId ? resp.data : c));
      if (expandedCollection?._id === colId) setExpandedCollection(resp.data);
      toast.success('Removed from collection');
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader2 className="w-12 h-12 text-gold-text animate-spin" />
    </div>
  );

  const filteredMovies = watchlist.filter(m => m.status === activeTab);

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-6 md:px-16 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <BookmarkIcon className="w-8 h-8 md:w-10 md:h-10 text-gold-text" fill="#ffd700" />
            <h1 className="text-2xl md:text-4xl font-black gold-text uppercase tracking-tight">Your Library</h1>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 md:flex-none px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-bold transition-all ${activeTab === 'pending' ? 'bg-gold-text text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Watchlist
            </button>
            <button
              onClick={() => setActiveTab('watched')}
              className={`flex-1 md:flex-none px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-bold transition-all ${activeTab === 'watched' ? 'bg-gold-text text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Watched
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`flex-1 md:flex-none px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-bold transition-all ${activeTab === 'collections' ? 'bg-gold-text text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Collections
            </button>
          </div>
        </div>

        {activeTab === 'collections' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-end">
               <button onClick={() => setShowCollectionModal(true)} className="gold-button px-6 py-3 rounded-xl flex items-center gap-2 font-bold"><Plus className="w-5 h-5"/> Create Collection</button>
            </div>
            
            {collections.length === 0 ? (
              <div className="text-center py-20 glass-card">
                <FolderOpen className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                <p className="text-xl text-gray-500 font-bold uppercase tracking-tight">No collections yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {collections.map(col => (
                  <div key={col._id} className="glass-card p-6 border-white/5 transition-all w-full cursor-pointer hover:border-gold-text/50" onClick={() => setExpandedCollection(expandedCollection?._id === col._id ? null : col)}>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <FolderOpen className="w-8 h-8 text-gold-text" />
                           <div>
                             <h3 className="text-xl font-bold">{col.name}</h3>
                             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{col.movies.length} Movies</p>
                           </div>
                        </div>
                        <button onClick={(e) => handleDeleteCollection(col._id, e)} className="p-2 hover:bg-black/30 rounded-full text-red-500/50 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                     </div>
                     
                     <AnimatePresence>
                       {expandedCollection?._id === col._id && (
                         <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="pt-6 mt-6 border-t border-white/5 grid grid-cols-3 sm:grid-cols-4 gap-4 overflow-hidden">
                            {col.movies.map(m => (
                              <div key={m.id} className="relative aspect-[2/3] group rounded-lg overflow-hidden border border-white/10" onClick={(e) => { e.stopPropagation(); navigate(`/movie/${m.id}`); }}>
                                 <img src={`https://image.tmdb.org/t/p/w200${m.posterPath}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt=""/>
                                 <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={(e) => { e.stopPropagation(); removeFromCollection(col._id, m.id); }} className="p-1.5 bg-black/80 backdrop-blur-sm border border-white/10 rounded-full text-red-500 hover:text-white hover:bg-red-500"><X className="w-3 h-3"/></button>
                                 </div>
                              </div>
                            ))}
                            {col.movies.length === 0 && <p className="col-span-full text-center py-8 text-xs text-gray-500 uppercase font-black tracking-widest">Empty Collection</p>}
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
            
            {showCollectionModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCollectionModal(false)}>
                 <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-gold-text/30 w-full max-w-md animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <h2 className="text-2xl font-black mb-6 gold-text uppercase tracking-tighter">New Collection</h2>
                    <form onSubmit={handleCreateCollection}>
                      <input type="text" placeholder="Collection Name (e.g., Sci-Fi Favorites)" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-gold-text outline-none mb-6 font-bold" autoFocus/>
                      <div className="flex gap-4">
                        <button type="button" onClick={() => setShowCollectionModal(false)} className="flex-1 py-3 rounded-xl border border-white/20 font-black uppercase tracking-widest hover:bg-white/5 text-sm">Cancel</button>
                        <button type="submit" disabled={!newCollectionName.trim()} className="flex-1 py-3 rounded-xl bg-gold-text text-black font-black uppercase tracking-widest text-sm disabled:opacity-30">Create</button>
                      </div>
                    </form>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab !== 'collections' && (filteredMovies.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <Bookmark className="w-16 md:w-20 h-16 md:h-20 text-gray-700 mx-auto mb-6" />
            <p className="text-xl md:text-2xl text-gray-500 font-medium font-bold uppercase tracking-tight">Your {activeTab} list is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence>
              {filteredMovies.map(movie => (
                <motion.div
                  key={movie.movieId}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card overflow-hidden group border-gold-text/20 hover:border-gold-text/50 transition-all duration-300 shadow-xl flex flex-col"
                >
                  <div 
                    className="relative aspect-[2/3] overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/movie/${movie.movieId}`)}
                  >
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`} 
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchlist(movie.movieId);
                        }}
                        className="p-2 bg-black/60 backdrop-blur-md rounded-full text-red-400 hover:bg-red-400 hover:text-white transition-all border border-red-400/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 flex-1 flex flex-col">
                    <h3 
                      className="text-lg md:text-xl font-bold mb-4 line-clamp-1 group-hover:text-gold-text transition-colors cursor-pointer"
                      onClick={() => navigate(`/movie/${movie.movieId}`)}
                    >
                      {movie.title}
                    </h3>
                    
                    <div className="mt-auto">
                      {activeTab === 'pending' ? (
                        <button
                          onClick={() => markAsWatched(movie.movieId)}
                          className="w-full py-2 md:py-3 rounded-lg border-2 border-gold-text text-gold-text font-bold flex items-center justify-center gap-2 hover:bg-gold-text hover:text-black transition-all text-sm md:text-base"
                        >
                          <CheckCircle className="w-5 h-5" /> Mark Watched
                        </button>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Rate & Review</p>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => rateMovie(movie.movieId, star)}
                                className="transition-transform hover:scale-125"
                              >
                                <Star 
                                  className={`w-5 md:w-6 h-5 md:h-6 ${movie.rating >= star ? 'text-gold-text fill-gold-text shadow-[0_0_10px_rgba(255,215,0,0.3)]' : 'text-gray-700'}`} 
                                />
                              </button>
                            ))}
                          </div>
                          
                          <div className="flex flex-col gap-2 w-full">
                            <textarea
                              defaultValue={movie.review || ''}
                              placeholder="Add a review..."
                              onBlur={(e) => {
                                if (e.target.value !== movie.review) {
                                  rateMovie(movie.movieId, movie.rating || 0, e.target.value);
                                }
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white placeholder:text-gray-600 focus:border-gold-text outline-none min-h-[60px] transition-all resize-none mt-2"
                            />
                            {movie.rating > 0 && (
                              <button 
                                onClick={() => removeRating(movie.movieId)}
                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20 text-[10px] font-black uppercase"
                              >
                                Remove Rating
                              </button>
                            )}
                          </div>
                          
                          {movie.review && (
                            <div className="p-3 bg-gold-text/5 rounded-lg border border-gold-text/20 w-full text-center">
                               <p className="text-[10px] text-gray-400 italic line-clamp-2 uppercase font-bold tracking-tight">"Shared with community"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
