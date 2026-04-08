import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MovieCard from '../components/MovieCard';
import { Loader2, ChevronLeft, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ViewAll = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const type = searchParams.get('type');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let response;
        let pageTitle = searchParams.get('title') || 'Movies';

        if (type === 'upcoming') {
          response = await api.get('/movies/upcoming?fetchAll=true');
        } else if (type === 'now_playing') {
          response = await api.get('/movies/now-playing?fetchAll=true');
        } else if (type === 'recommendation') {
          const recRes = await api.get('/movies/recommendations?fetchAll=true');
          // If we have a specific title, find that section
          const sectionTitle = searchParams.get('title');
          if (sectionTitle) {
            const section = recRes.data.find(s => s.title === sectionTitle);
            response = { data: section ? section.movies : [] };
          } else {
            const allMovies = recRes.data.flatMap(section => section.movies);
            const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());
            response = { data: uniqueMovies };
          }
        } else {
          response = { data: [] };
        }

        let processedMovies = response.data;

        if (type === 'upcoming') {
          const hRes = await api.get('/hypes/all');
          const hypes = hRes.data;
          
          processedMovies = processedMovies.map(movie => {
            const hype = hypes.find(item => item.movieId === movie.id.toString());
            return {
              ...movie,
              hypeCount: hype?.hypeCount || 0,
              hypeInfo: {
                hypeCount: hype?.hypeCount || 0,
                isHyped: user ? hype?.hypedBy?.includes(user.id) : false
              }
            };
          });

          // Sort by hype count
          processedMovies.sort((a, b) => b.hypeCount - a.hypeCount);

          // Add rank to top 3
          processedMovies = processedMovies.map((movie, index) => ({
            ...movie,
            hypeRank: movie.hypeCount > 0 && index < 3 ? index + 1 : null
          }));
        }

        setMovies(processedMovies);
        setTitle(pageTitle);
      } catch (error) {
        console.error('Failed to fetch movies', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [type, user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader2 className="w-12 h-12 text-gold-text animate-spin" />
    </div>
  );

  return (
    <main className="pt-24 min-h-screen bg-black text-white px-6 md:px-16 pb-20">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gold-text transition-colors mb-8 group uppercase font-black text-xs tracking-widest"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-gold-text/10 flex items-center justify-center border border-gold-text/20">
            <Film className="w-6 h-6 text-gold-text" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black gold-text uppercase tracking-tighter">{title}</h1>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-20 glass-card opacity-50">
            <p className="text-xl italic uppercase tracking-widest">No movies found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
            {movies.map(movie => (
              <div key={movie.id} className="relative">
                {type === 'upcoming' && movie.hypeRank && (
                  <div className="absolute top-2 left-2 z-20 bg-gold-text text-black px-4 py-1.5 rounded-full font-black text-[10px] shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-black/20">
                    #{movie.hypeRank} HYPED
                  </div>
                )}
                <MovieCard movie={movie} type={type} initialHype={movie.hypeInfo} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default ViewAll;
