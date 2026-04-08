import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Star, Play, Eye, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MovieCard = ({ movie, type, initialHype, hypeRank }) => {
  const [trailerUrl, setTrailerUrl] = React.useState(null);
  const [loadingTrailer, setLoadingTrailer] = React.useState(false);
  const [hypeInfo, setHypeInfo] = React.useState(initialHype || { isHyped: false, hypeCount: 0 });
  const { user, setUser } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];
  const isUpcoming = movie.release_date > today;
  
  const isInLibrary = user?.watchlist?.find(m => m.movieId === movie.id.toString());
  const isWatched = isInLibrary?.status === 'watched';

  React.useEffect(() => {
    const fetchTrailer = async () => {
      setLoadingTrailer(true);
      try {
        const { data } = await api.get(`/movies/videos/${movie.id}`);
        // Broaden search to Trailer, Teaser, or Featurette
        const trailer = data.find(v => v.type === 'Trailer' && v.site === 'YouTube') || 
                        data.find(v => v.type === 'Teaser' && v.site === 'YouTube') ||
                        data.find(v => v.site === 'YouTube');
        
        if (trailer) {
          setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
        } else {
          // YouTube search fallback if no direct video found
          setTrailerUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`);
        }
      } catch (error) {
        console.error('Failed to fetch trailer', error);
      } finally {
        setLoadingTrailer(false);
      }
    };
    fetchTrailer();

    const fetchHype = async () => {
      if (isUpcoming && !initialHype) {
        try {
          const { data } = await api.get(`/hypes/stats?movieIds=${movie.id}`);
          if (data[movie.id]) {
            setHypeInfo(data[movie.id]);
          }
        } catch (error) {}
      }
    };
    fetchHype();
  }, [movie.id, movie.title, isUpcoming, initialHype]);

  const addToWatchlist = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/movies/watchlist/add', {
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path
      });
      if (response.data.watchlist) {
        setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      }
      toast.success('Added to watchlist');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to watchlist');
    }
  };

  const markAsWatched = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/movies/watchlist/watched/${movie.id}`, {
        title: movie.title,
        posterPath: movie.poster_path
      });
      if (response.data.watchlist) {
        setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      }
      toast.success('Marked as watched!');
    } catch (error) {
      toast.error('Failed to mark as watched');
    }
  };

  const removeFromLibrary = async (e) => {
    e.preventDefault();
    try {
      const response = await api.delete(`/movies/watchlist/remove/${movie.id}`);
      if (response.data.watchlist) {
        setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      }
      toast.success('Removed from library');
    } catch (error) {
      toast.error('Failed to remove from library');
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="relative group w-full h-full flex flex-col glass-card overflow-hidden shadow-2xl transition-all duration-300"
    >
      <Link to={`/movie/${movie.id}`} className="flex flex-col h-full">
        <div className="relative aspect-[2/3] overflow-hidden flex-shrink-0">
          <img 
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750/1a1a1a/ffd700?text=No+Poster\n(API+Missing)'} 
            alt={movie.title}
            className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {trailerUrl ? (
              <a 
                href={trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-5 bg-gold-text text-black rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group/trailer"
              >
                <Play fill="black" className="w-6 h-6" />
                <span className="max-w-0 overflow-hidden group-hover/trailer:max-w-xs transition-all duration-500 whitespace-nowrap font-black uppercase text-xs tracking-widest">
                  {isUpcoming ? 'Watch Trailer' : 'View Trailer'}
                </span>
              </a>
            ) : (
              <div className="p-4 bg-gold-text/50 text-black rounded-full shadow-lg">
                <Play className="w-6 h-6" fill="black" />
              </div>
            )}
          </div>
          {!isUpcoming && movie.vote_average > 0 && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md border border-gold-text/30 rounded-md flex items-center gap-1 text-sm font-bold text-gold-text">
              <Star className="w-4 h-4" fill="#ffd700" />
              {movie.vote_average.toFixed(1)}
            </div>
          )}
          {isUpcoming && hypeRank && (
            <div className="absolute top-2 right-2 z-20 bg-gold-text text-black px-3 py-1 rounded-full font-black text-[10px] shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-black/20 animate-pulse">
              #{hypeRank} HYPED
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 bg-gradient-to-t from-black to-transparent">
          <h3 className="font-bold text-base sm:text-lg line-clamp-1 group-hover:text-gold-text transition-colors">
            {movie.title}
          </h3>
          <div className="flex flex-col mt-1 sm:mt-2 gap-2">
            <div className="flex justify-between items-center w-full">
              <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                {isUpcoming ? (
                  <span className="text-gold-text/70 italic">Releasing on {movie.release_date}</span>
                ) : (
                  <span>Released on {movie.release_date}</span>
                )}
              </p>
            </div>
            <div className="flex justify-between items-center gap-1.5 sm:gap-2">
              <a 
                href={trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title)}+trailer`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-gold-text text-black rounded-lg font-black text-[8px] sm:text-[10px] uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                title="Watch Trailer on YouTube"
              >
                <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="black" />
                <span className="xs:inline">
                  {trailerUrl?.includes('results?search_query') ? 'SEARCH TRAILER' : 'WATCH TRAILER'}
                </span>
              </a>
              {isInLibrary ? (
                <>
                  {!isWatched && !isUpcoming && (
                    <button 
                      onClick={markAsWatched}
                      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full border border-white/20 transition-all text-white"
                      title="Mark as Watched"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <button 
                    onClick={removeFromLibrary}
                    className="p-1.5 sm:p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full border border-white/20 transition-all text-gray-400"
                    title="Remove from Library"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </>
              ) : (
                <>
                  {!isUpcoming && (
                    <button 
                      onClick={markAsWatched}
                      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full border border-white/20 transition-all text-white"
                      title="Mark as Watched"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <button 
                    onClick={addToWatchlist}
                    className="p-1.5 sm:p-2 hover:bg-gold-text hover:text-black rounded-full border border-gold-text/30 transition-all text-gold-text"
                    title="Add to Watchlist"
                  >
                    <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default MovieCard;
