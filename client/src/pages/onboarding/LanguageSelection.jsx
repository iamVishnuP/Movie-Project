import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Check, ArrowRight, Loader2, Globe, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const languages = [
  { id: 'ml', name: 'Malayalam' },
  { id: 'en', name: 'English' },
  { id: 'ta', name: 'Tamil' },
  { id: 'te', name: 'Telugu' },
  { id: 'kn', name: 'Kannada' },
  { id: 'hi', name: 'Hindi' },
  { id: 'or', name: 'Other' }
];

const LanguageSelection = () => {
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length < 1) {
      return toast.error('Please select at least 1 language');
    }
    setLoading(true);
    try {
      await api.post('/auth/update-profile', { selectedLanguages: selected });
      setUser(prev => ({ ...prev, selectedLanguages: selected }));
      toast.success('Languages saved!');
      navigate('/onboarding/directors');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const filteredLanguages = languages.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden text-white">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-text/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-text/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-4xl relative">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gold-text flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            <Globe className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold gold-text">Choose Your Languages</h1>
          <p className="text-gray-400 mt-2 text-lg">Select languages you prefer for movies</p>
        </div>

        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-gold-text transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-12 px-2 md:px-0">
          {filteredLanguages.map(lang => (
            <button
              key={lang.id}
              onClick={() => toggleLanguage(lang.id)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 flex items-center justify-center font-bold text-lg
                ${selected.includes(lang.id) 
                  ? 'selection-card-selected' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-gold-text/50 hover:text-white'}`}
            >
              {lang.name}
              {selected.includes(lang.id) && (
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

export default LanguageSelection;
