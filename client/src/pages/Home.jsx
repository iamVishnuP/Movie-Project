import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import MovieCard from '../components/MovieCard';
import { Loader2, TrendingUp, Calendar, Sparkles, ChevronLeft, ChevronRight, Globe, MessageSquare, Users } from 'lucide-react';
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
              <MovieCard movie={movie} type={type} initialHype={movie.hypeInfo} hypeRank={movie.hypeRank} />
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
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [publicDiscussions, setPublicDiscussions] = useState([]);
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
          api.get('/movies/now-playing')
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

        // Fetch public discussions
        try {
          const pubDisc = await api.get('/discussions/public');
          setPublicDiscussions(pubDisc.data);
        } catch (e) {
          console.error('Failed to fetch public discussions', e);
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

        {/* Public Discussions Section */}
        {publicDiscussions.length > 0 && (
          <section className="mb-16 px-4">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-gold-text shadow-[0_0_10px_rgba(255,215,0,0.3)]" />
              <h2 className="text-2xl font-black tracking-tighter gold-text uppercase">Public Discussion Rooms</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicDiscussions.map(disc => (
                <div
                  key={disc._id}
                  onClick={() => navigate(`/discussions/${disc._id}`)}
                  className="relative rounded-2xl overflow-hidden border border-white/10 hover:border-gold-text/40 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.08)]"
                >
                  {/* Backdrop */}
                  <div className="aspect-video w-full relative">
                    <img
                      src={disc.image || `https://image.tmdb.org/t/p/w780${disc.movie?.posterPath}`}
                      alt={disc.movie?.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    {/* Public badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                      <Globe className="w-3 h-3 text-green-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Public</span>
                    </div>
                    {/* Participants */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 border border-white/10 rounded-full">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{(disc.participants || []).length}</span>
                    </div>
                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gold-text/80 mb-1">{disc.movie?.title}</p>
                      <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{disc.caption}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Home;
