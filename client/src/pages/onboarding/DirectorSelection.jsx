import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Check, ArrowRight, Loader2, User, Search, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const DirectorSelection = () => {
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();



  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        setSearchLoading(true);
        try {
          const response = await api.get(`/movies/search/person?query=${encodeURIComponent(searchTerm)}`);
          setDirectors(response.data?.filter(p => p.known_for_department === 'Directing') || []);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setSearchLoading(false);
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const toggleDirector = (director) => {
    setSelected(prev => 
      prev.find(d => d.id === director.id) 
        ? prev.filter(d => d.id !== director.id) 
        : [...prev, { id: director.id, name: director.name, profilePath: director.profile_path }]
    );
  };

  const handleSubmit = async () => {
    if (selected.length < 1) {
      return toast.error('Please select at least 1 director');
    }
    setLoading(true);
    try {
      await api.post('/auth/update-profile', { favoriteDirectors: selected });
      setUser(prev => ({ ...prev, favoriteDirectors: selected }));
      toast.success('Directors saved!');
      navigate('/onboarding/movies');
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

      <div className="w-full max-w-5xl relative">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gold-text flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            <User className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold gold-text">Favorite Directors</h1>
          <p className="text-gray-400 mt-2 text-lg">Who creates your favorite cinematic worlds?</p>
        </div>

        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search directors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-gold-text transition-colors"
          />
          {searchLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gold-text" />}
        </div>

        {searchTerm && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 mb-12 px-2 md:px-0">
            {directors.map(director => (
              <div
                key={director.id}
                onClick={() => toggleDirector(director)}
                className={`group cursor-pointer flex flex-col items-center p-4 rounded-2xl transition-all duration-300 border-2
                  ${selected.find(d => d.id === director.id) 
                    ? 'selection-card-selected' 
                    : 'bg-white/5 border-transparent hover:border-white/20'}`}
              >
                <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-transparent group-hover:border-gold-text transition-all">
                  <img
                    src={director.profile_path ? `https://image.tmdb.org/t/p/w185${director.profile_path}` : 'https://placehold.co/185x185/1a1a1a/ffd700?text=No+Img'}
                    alt={director.name}
                    className="w-full h-full object-cover"
                  />
                  {selected.find(d => d.id === director.id) && (
                    <div className="absolute inset-0 bg-gold-text/40 flex items-center justify-center">
                      <Check className="w-8 h-8 text-black font-bold" />
                    </div>
                  )}
                </div>
                <span className={`text-center font-bold text-sm line-clamp-1 ${selected.find(d => d.id === director.id) ? 'gold-text' : 'text-gray-300 group-hover:text-white'}`}>
                  {director.name}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold gold-text mb-6">Your Chosen Directors</h2>
          {selected.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 px-2 md:px-0">
              {selected.map(director => (
                <div key={director.id} className="flex flex-col items-center">
                  <img
                    src={director.profilePath ? `https://image.tmdb.org/t/p/w185${director.profilePath}` : 'https://placehold.co/185x185/1a1a1a/ffd700?text=No+Img'}
                    alt={director.name}
                    className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-gold-text"
                  />
                  <span className="text-center font-bold text-sm text-white">{director.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Search for directors to add them to your list.</p>
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
              Next Step <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DirectorSelection;
