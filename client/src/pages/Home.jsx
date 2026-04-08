import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import MovieCard from '../components/MovieCard';
import { Loader2, TrendingUp, Calendar, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { HomeSkeleton } from '../components/Skeleton';

const SectionTitle = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-3 mb-6 px-4">
    <Icon className="w-6 h-6 text-gold-text" />
    <h2 className="text-2xl font-bold tracking-tight gold-text uppercase">{title}</h2>
  </div>
);

const MovieRow = ({ title, movies, icon: Icon, type, genreId }) => {
  const scrollRef = React.useRef(null);
  const navigate = useNavigate();

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleViewAll = () => {
    let path = `/view-all?type=${type}&title=${encodeURIComponent(title)}`;
    if (genreId) path += `&genreId=${genreId}`;
    navigate(path);
  };

  return (
    <section className="mb-16 relative group/row px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-gold-text shadow-[0_0_10px_rgba(255,215,0,0.3)]" />
          <h2 className="text-2xl font-black tracking-tighter gold-text uppercase">{title}</h2>
        </div>
        <button 
          onClick={handleViewAll}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-gold-text transition-colors flex items-center gap-2 group"
        >
          View All <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="relative">
        {/* Left Scroll Button */}
        <button 
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black border border-white/10 rounded-full items-center justify-center text-gold-text opacity-0 group-hover/row:opacity-100 transition-all hover:bg-gold-text hover:text-black hover:scale-110 shadow-2xl"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div 
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto horizontal-scroll pb-8 scroll-smooth no-scrollbar px-2 md:px-0"
        >
          {movies.map(movie => (
            <div key={movie.id} className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px] lg:w-[250px] flex flex-col relative">
              {type === 'upcoming' && movie.hypeRank && (
                <div className="absolute -top-2 -left-2 z-20 bg-gold-text text-black px-3 py-1 rounded-full font-black text-[10px] shadow-[0_0_15px_rgba(255,215,0,0.6)] animate-bounce">
                  #{movie.hypeRank} HYPED
                </div>
              )}
              <MovieCard movie={movie} type={type} initialHype={movie.hypeInfo} />
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button 
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black border border-white/10 rounded-full items-center justify-center text-gold-text opacity-0 group-hover/row:opacity-100 transition-all hover:bg-gold-text hover:text-black hover:scale-110 shadow-2xl"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};

const Home = () => {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hype data first as it is local and reliable
        let hData = [];
        try {
          const h = await api.get('/hypes/all');
          hData = h.data;
        } catch (e) {
          console.error('Hype fetch failed', e);
        }

        const fetchResults = await Promise.allSettled([
          api.get('/movies/upcoming'),
          api.get('/movies/now-playing'),
          api.get('/movies/recommendations')
        ]);

        if (fetchResults[0].status === 'fulfilled') {
          const uData = fetchResults[0].value.data;
          let processedUpcoming = uData.map(movie => {
            const hype = hData.find(item => item.movieId === movie.id.toString());
            return {
              ...movie,
              hypeCount: hype?.hypeCount || 0,
              hypeInfo: {
                hypeCount: hype?.hypeCount || 0,
                isHyped: user ? hype?.hypedBy?.includes(user.id) : false
              }
            };
          });
          processedUpcoming.sort((a, b) => b.hypeCount - a.hypeCount);
          processedUpcoming = processedUpcoming.map((movie, index) => ({
            ...movie,
            hypeRank: movie.hypeCount > 0 && index < 3 ? index + 1 : null
          }));
          setUpcoming(processedUpcoming);
        }

        if (fetchResults[1].status === 'fulfilled') {
          setNowPlaying(fetchResults[1].value.data);
        }

        if (fetchResults[2].status === 'fulfilled') {
          setRecommendations(fetchResults[2].value.data);
        }

      } catch (error) {
        console.error('Failed to fetch movies', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <HomeSkeleton />;

  return (
    <main className="pt-24 min-h-screen bg-black overflow-x-hidden">
      <div className="container mx-auto">
        <MovieRow title="Upcoming Films" movies={upcoming} icon={Calendar} type="upcoming" />
        <MovieRow title="Now in Theatres" movies={nowPlaying} icon={TrendingUp} type="now_playing" />
        
        {recommendations.map((section, idx) => (
          <MovieRow 
            key={idx} 
            title={section.title} 
            movies={section.movies} 
            icon={Sparkles} 
            type="recommendation"
          />
        ))}
      </div>
    </main>
  );
};

export default Home;
