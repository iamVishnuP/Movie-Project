import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Check, ArrowRight, Loader2, Film, Search, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const MovieSelection = () => {
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();



  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        setSearchLoading(true);
        try {
          const response = await api.get(`/movies/search?query=${encodeURIComponent(searchTerm)}`);
          setMovies(response.data || []);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setSearchLoading(false);
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const toggleMovie = (movie) => {
    setSelected(prev => 
      prev.find(m => m.id === movie.id) 
        ? prev.filter(m => m.id !== movie.id) 
        : [...prev, { id: movie.id, title: movie.title, posterPath: movie.poster_path }]
    );
  };

  const handleSubmit = async () => {
    if (selected.length < 1) {
      return toast.error('Please select at least 1 movie');
    }
    setLoading(true);
    try {
      await api.post('/auth/update-profile', { favoriteMovies: selected });
      setUser(prev => ({ ...prev, favoriteMovies: selected }));
      toast.success('Favorite movies saved!');
      navigate('/onboarding/completion');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden text-white">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-text/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-text/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-6xl relative">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gold-text flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            <Film className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold gold-text">Personal Favorites</h1>
          <p className="text-gray-400 mt-2 text-lg">Select movies that define your taste</p>
        </div>

        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-gold-text transition-colors"
          />
          {searchLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gold-text" />}
        </div>

        {searchTerm && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6 mb-12 px-2 md:px-0">
            {movies.map(movie => (
              <div
                key={movie.id}
                onClick={() => toggleMovie(movie)}
                className={`relative group cursor-pointer aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all duration-300
                  ${selected.find(m => m.id === movie.id) 
                    ? 'selection-card-selected' 
                    : 'border-white/10 hover:border-white/30'}`}
              >
                <img
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'https://placehold.co/342x513/1a1a1a/ffd700?text=No+Poster'}
                  alt={movie.title}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${selected.find(m => m.id === movie.id) ? 'opacity-40' : 'opacity-100'}`}
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <p className="text-sm font-bold truncate">{movie.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-gold-text">
                    <Star className="w-3 h-3" fill="#ffd700" />
                    <span className="text-xs">{movie.vote_average?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
                {selected.find(m => m.id === movie.id) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gold-text flex items-center justify-center shadow-lg">
                      <Check className="w-7 h-7 text-black font-bold" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold gold-text mb-6">Your Favorite Movies</h2>
          {selected.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 px-2 md:px-0">
              {selected.map(movie => (
                <div key={movie.id} className="flex flex-col items-center">
                  <img
                    src={movie.posterPath ? `https://image.tmdb.org/t/p/w342${movie.posterPath}` : 'https://placehold.co/342x513/1a1a1a/ffd700?text=No+Poster'}
                    alt={movie.title}
                    className="aspect-[2/3] w-full rounded-xl object-cover mb-2 border-2 border-gold-text"
                  />
                  <span className="text-center font-bold text-sm text-white truncate w-full">{movie.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Search for movies to add them to your list.</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || selected.length < 1}
          className="w-full max-w-md mx-auto gold-button py-4 rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Complete Setup <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MovieSelection;
