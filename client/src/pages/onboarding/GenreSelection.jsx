// Force reload for Vite
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const genres = [
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

const GenreSelection = () => {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const toggleGenre = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length < 1) {
      return toast.error('Please select at least 1 genre');
    }
    setLoading(true);
    try {
      await api.post('/auth/update-profile', { selectedGenres: selected });
      setUser(prev => ({ ...prev, selectedGenres: selected }));
      toast.success('Genres saved!');
      navigate('/onboarding/languages');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-text/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-text/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-4xl relative">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gold-text flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold gold-text">Choose Your Genres</h1>
          <p className="text-gray-400 mt-2 text-lg">Select at least 1 genre you love</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 mb-12 px-4 md:px-0">
          {genres.map(genre => (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 flex items-center justify-center font-bold text-lg
                ${selected.includes(genre.id) 
                  ? 'selection-card-selected' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-gold-text/50 hover:text-white'}`}
            >
              {genre.name}
              {selected.includes(genre.id) && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          ))}
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

export default GenreSelection;
