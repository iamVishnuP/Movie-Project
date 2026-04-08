import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { 
  Film, 
  Search, 
  Users, 
  Send, 
  Loader2, 
  X, 
  Check, 
  Clapperboard,
  Image as ImageIcon,
  Camera 
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreateDiscussion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [movieSearch, setMovieSearch] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  const [caption, setCaption] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [customImage, setCustomImage] = useState('');
  
  const [connections, setConnections] = useState([]);
  const [invitedIds, setInvitedIds] = useState([]);
  const [connLoading, setConnLoading] = useState(false);

  useEffect(() => {
    if (location.state?.prefill) {
      const p = location.state.prefill;
      setSelectedMovie({
        id: p.movieId,
        title: p.movieTitle,
        poster_path: p.moviePoster,
        backdrop_path: p.movieImage
      });
      setStep(2);
      // Consume the state so it doesn't loop if user navigates back to step 1
      window.history.replaceState({}, document.title)
    }
  }, [location]);

  useEffect(() => {
    if (step === 3) {
      fetchConnections();
    }
  }, [step]);

  const fetchConnections = async () => {
    setConnLoading(true);
    try {
      const response = await api.get('/connections/my-connections');
      setConnections(response.data);
    } catch (error) {
      console.error('Failed to fetch connections');
    } finally {
      setConnLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setCustomImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleMovieSearch = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await api.get(`/movies/search?query=${encodeURIComponent(query)}`);
      setMovieResults(response.data);
    } catch (error) {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (invitedIds.length === 0) {
      toast.error('Please invite at least one connection');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/discussions/create', {
        movie: {
          id: selectedMovie.id.toString(),
          title: selectedMovie.title,
          posterPath: selectedMovie.poster_path
        },
        caption,
        thoughts,
        image: customImage || `https://image.tmdb.org/t/p/original${selectedMovie.backdrop_path || selectedMovie.poster_path}`,
        invitedIds
      });
      toast.success('Discussion invitation sent!');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to create discussion');
    } finally {
      setLoading(false);
    }
  };

  const toggleInvite = (id) => {
    setInvitedIds(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    let timeoutId;
    if (movieSearch.trim()) {
      timeoutId = setTimeout(() => {
        handleMovieSearch(movieSearch);
      }, 500);
    } else {
      setMovieResults([]);
    }
    return () => clearTimeout(timeoutId);
  }, [movieSearch]);

  return (
    <main className="pt-24 min-h-screen bg-black text-white px-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <div className="flex justify-between items-end mb-6">
             <h1 className="text-4xl font-black tracking-tighter gold-text">Create Discussion</h1>
             <div className="text-gray-500 font-bold text-sm uppercase tracking-widest">Step {step} of 3</div>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-gold-text transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-3"><Film className="text-gold-text" /> Select a Movie</h2>
            <div className="relative mb-8 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-gold-text transition-colors" />
              <input 
                type="text" 
                placeholder="Search for a movie..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:border-gold-text outline-none font-bold tracking-tight transition-all"
                value={movieSearch}
                onChange={(e) => setMovieSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {movieResults.map(movie => (
                <div 
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className={`p-3 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${selectedMovie?.id === movie.id ? 'bg-gold-text/10 border-gold-text shadow-[0_0_20px_rgba(255,215,0,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                >
                  <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'https://placehold.co/92x138/1a1a1a/ffd700?text=No+Img'} className="w-10 h-14 object-cover rounded shadow-lg" alt={movie.title} />
                  <div className="flex-1">
                    <p className="font-bold tracking-tight">{movie.title}</p>
                    <p className="text-xs text-gray-500 font-bold">{movie.release_date?.split('-')[0]}</p>
                  </div>
                  {selectedMovie?.id === movie.id && <div className="w-6 h-6 rounded-full bg-gold-text flex items-center justify-center"><Check className="text-black w-4 h-4" /></div>}
                </div>
              ))}
            </div>

            <button 
              disabled={!selectedMovie}
              onClick={() => setStep(2)}
              className="mt-12 w-full py-4 bg-gold-text text-black rounded-xl font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
            >
              Continue <Check className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-3"><Clapperboard className="text-gold-text" /> Discussion Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Short Caption</label>
                <input 
                  type="text" 
                  placeholder="e.g. The ending was insane!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-gold-text outline-none font-bold tracking-tight"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Detailed Thoughts</label>
                <textarea 
                  placeholder="What did you really think? Share your detailed analysis..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-gold-text outline-none font-bold tracking-tight"
                  value={thoughts}
                  onChange={(e) => setThoughts(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Cover Image</label>
                <div className="flex flex-col gap-4">
                  {customImage ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video border border-gold-text/30 group">
                      <img src={customImage} className="w-full h-full object-cover" alt="preview" />
                      <button 
                        onClick={() => setCustomImage('')}
                        className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-gold-text/30 hover:bg-gold-text/5 transition-all">
                      <Camera className="w-8 h-8 text-gray-500" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-300">Upload Cover Image</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">PNG, JPG up to 2MB</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                  <div className="relative">
                     <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                     <input 
                      type="text" 
                      placeholder="Or paste an image URL..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-14 focus:border-gold-text outline-none font-bold tracking-tight text-sm"
                      value={customImage.startsWith('data:') ? '' : customImage}
                      onChange={(e) => setCustomImage(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
               <button onClick={() => setStep(1)} className="flex-1 py-4 border border-white/10 rounded-xl font-black uppercase tracking-widest hover:bg-white/5 transition-all">Back</button>
               <button 
                 disabled={!caption || !thoughts}
                 onClick={() => setStep(3)}
                 className="flex-[2] py-4 bg-gold-text text-black rounded-xl font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
               >
                 Invite Connection <Users className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-3"><Users className="text-gold-text" /> Invite Connection</h2>
            <p className="text-gray-500 text-sm mb-6 uppercase tracking-wider font-bold">You must invite at least one connection to start the room.</p>
            
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {connections.map(user => (
                <div 
                  key={user._id}
                  onClick={() => toggleInvite(user._id)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${invitedIds.includes(user._id) ? 'bg-gold-text/10 border-gold-text' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold-text flex items-center justify-center text-black font-black uppercase">
                       {user.name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold gold-text uppercase">@{user.characterName}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black">{user.name}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${invitedIds.includes(user._id) ? 'bg-gold-text border-gold-text' : 'border-white/10'}`}>
                    {invitedIds.includes(user._id) && <Check className="w-4 h-4 text-black" />}
                  </div>
                </div>
              ))}
              {connections.length === 0 && !connLoading && (
                <div className="py-20 text-center glass-card opacity-30">
                   <Users className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                   <p className="text-xs italic uppercase tracking-widest">You have no connections to invite</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-12">
               <button onClick={() => setStep(2)} className="flex-1 py-4 border border-white/10 rounded-xl font-black uppercase tracking-widest hover:bg-white/5 transition-all">Back</button>
               <button 
                 disabled={invitedIds.length === 0 || loading}
                 onClick={handleSubmit}
                 className="flex-[2] py-4 bg-gold-text text-black rounded-xl font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Invitation <Send className="w-5 h-5" /></>}
               </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CreateDiscussion;
