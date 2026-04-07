import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Play, Star, Clock, Globe, Calendar, User, Loader2, Bookmark, CheckCircle, MessageSquare, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MovieDetail = () => {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await api.get(`/movies/detail/${id}`);
        setMovie(response.data);
      } catch (error) {
        toast.error('Failed to fetch movie details');
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await api.get(`/movies/detail/${id}/reviews`);
        setReviews(response.data);
      } catch (error) {
        console.error('Failed to fetch reviews');
      }
    };

    fetchMovie();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    const userMovie = user?.watchlist?.find(m => m.movieId === id.toString());
    if (userMovie?.review) {
      setReviewText(userMovie.review);
    }
  }, [user, id]);

  const addToWatchlist = async () => {
    try {
      const response = await api.post('/movies/watchlist/add', {
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path
      });
      setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      toast.success('Added to watchlist');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to watchlist');
    }
  };
  const markAsWatched = async () => {
    try {
      const response = await api.put(`/movies/watchlist/watched/${id}`, {
        title: movie.title,
        posterPath: movie.poster_path
      });
      setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      toast.success('Marked as watched!');
      // Scroll to review section
      const reviewSection = document.getElementById('review-section');
      if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      toast.error('Failed to mark as watched');
    }
  };

  const rateMovie = async (rating) => {
    try {
      const response = await api.put(`/movies/watchlist/rate/${id}`, { 
        rating,
        reviewText: reviewText 
      });
      setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      toast.success('Rating saved!');
      
      // Refresh global reviews
      const reviewsRes = await api.get(`/movies/detail/${id}/reviews`);
      setReviews(reviewsRes.data);
    } catch (error) {
      toast.error('Failed to save rating');
    }
  };

  const removeRating = async () => {
    try {
      const response = await api.delete(`/movies/watchlist/rate/${id}`);
      setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      setReviewText('');
      toast.success('Rating and review removed');
      
      // Refresh global reviews
      const reviewsRes = await api.get(`/movies/detail/${id}/reviews`);
      setReviews(reviewsRes.data);
    } catch (error) {
      toast.error('Failed to remove rating');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    const userMovie = user?.watchlist?.find(m => m.movieId === id.toString());
    const currentRating = userMovie?.rating || 0;

    if (currentRating < 1) {
      toast.error('Please select a star rating first!', { icon: '⭐' });
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      const response = await api.put(`/movies/watchlist/rate/${id}`, { 
        rating: currentRating,
        reviewText: reviewText 
      });
      setUser(prev => ({ ...prev, watchlist: response.data.watchlist }));
      toast.success('Review saved and shared!');
      
      // Refresh global reviews
      const reviewsRes = await api.get(`/movies/detail/${id}/reviews`);
      setReviews(reviewsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleLike = async (reviewId) => {
    if (!user) {
      toast.error('Please sign in to like reviews');
      return;
    }
    try {
      const response = await api.post(`/movies/reviews/${reviewId}/like`);
      setReviews(prev => prev.map(r => r._id === reviewId ? response.data : r));
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleDislike = async (reviewId) => {
    if (!user) {
      toast.error('Please sign in to dislike reviews');
      return;
    }
    try {
      const response = await api.post(`/movies/reviews/${reviewId}/dislike`);
      setReviews(prev => prev.map(r => r._id === reviewId ? response.data : r));
    } catch (error) {
      toast.error('Failed to update dislike');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader2 className="w-12 h-12 text-gold-text animate-spin" />
    </div>
  );

  if (!movie) return <div className="text-center py-20 bg-black min-h-screen text-gold-text">Movie not found</div>;

  const trailer = movie.videos?.results?.find(v => v.type === 'Trailer');
  const releaseInfo = movie.release_dates?.results?.find(r => r.iso_3166_1 === 'US') || movie.release_dates?.results?.[0];
  const certification = releaseInfo?.release_dates?.find(rd => rd.certification)?.certification || 'N/A';
  
  const userMovie = user?.watchlist?.find(m => m.movieId === id.toString());
  const isWatched = userMovie?.status === 'watched';
  const userRating = userMovie?.rating || 0;

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="relative min-h-[70vh] md:h-[80vh] w-full overflow-hidden flex items-end">
        <img 
          src={movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'https://placehold.co/1920x1080/1a1a1a/ffd700?text=No+Backdrop'} 
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        <div className="relative w-full p-6 md:p-16 flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-end">
          <img 
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750/1a1a1a/ffd700?text=No+Poster'} 
            alt={movie.title}
            className="w-48 md:w-72 rounded-2xl shadow-2xl border-2 border-gold-text/30 hover:scale-105 transition-transform duration-500"
          />
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
              <span className="px-3 py-1 rounded bg-gold-text text-black font-black text-sm uppercase tracking-widest">{certification}</span>
              <div className="flex items-center gap-2 text-gold-text">
                <Star className="w-6 h-6" fill="#ffd700" />
                <span className="text-2xl md:text-3xl font-black">{movie.vote_average?.toFixed(1)}</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-black mb-6 gold-text tracking-tighter leading-none">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-8 text-xl font-bold mb-10 text-gray-400">
               <div className="flex items-center gap-2">
                <Clock className="w-6 h-6" />
                <span>{movie.runtime}m</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                <span>{movie.release_date?.split('-')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-6 h-6" />
                <span className="uppercase">{movie.original_language}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-10">
              {movie.genres?.map(g => (
                <span key={g.id} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-md font-bold hover:border-gold-text/50 transition-colors">
                  {g.name}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              {trailer && (
                <a 
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-button px-10 py-5 rounded-2xl flex items-center gap-4 text-xl font-black uppercase tracking-widest"
                >
                  <Play className="w-7 h-7" fill="black" /> Watch Trailer
                </a>
              )}
              
              {!isWatched ? (
                <>
                  {!userMovie && (
                    <button 
                      onClick={addToWatchlist}
                      className="px-10 py-5 rounded-2xl border-2 border-white/20 text-white hover:border-gold-text hover:text-gold-text transition-all flex items-center gap-4 text-xl font-black uppercase tracking-widest"
                    >
                      <Bookmark className="w-7 h-7" /> Add to Library
                    </button>
                  )}
                  <button 
                    onClick={markAsWatched}
                    className="px-10 py-5 rounded-2xl border-2 border-white/20 text-white hover:border-white hover:bg-white/5 transition-all flex items-center gap-4 text-xl font-black uppercase tracking-widest"
                  >
                    <CheckCircle className="w-7 h-7" /> Already Watched
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-6 bg-gold-text/10 border border-gold-text/30 rounded-2xl px-10 py-5">
                   <div className="flex items-center gap-3 text-gold-text">
                     <CheckCircle className="w-8 h-8" fill="rgba(255,215,0,0.2)" />
                     <span className="text-xl font-black uppercase tracking-widest">Watched</span>
                   </div>
                   <div className="flex items-center gap-2 border-l border-gold-text/20 pl-6">
                     <span className="text-gray-400 text-sm font-bold uppercase mr-2">Your Rating:</span>
                     <div className="flex gap-1">
                       {[1, 2, 3, 4, 5].map(star => (
                         <button 
                          key={star} 
                          onClick={() => rateMovie(star)}
                          className="hover:scale-125 transition-transform"
                         >
                          <Star 
                            className={`w-7 h-7 ${userRating >= star ? 'text-gold-text fill-gold-text' : 'text-gray-700'}`} 
                          />
                         </button>
                       ))}
                     </div>
                   </div>
                    <button 
                      onClick={removeRating}
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                      title="Remove Rating & Review"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 md:p-16 grid grid-cols-1 md:grid-cols-3 gap-20">
        <div className="md:col-span-2">
          <div className="mb-20">
            <h2 className="text-4xl font-black mb-8 gold-text uppercase tracking-tighter">The Story</h2>
            <p className="text-2xl text-gray-300 leading-relaxed font-medium">
              {movie.overview}
            </p>
          </div>

          <h2 id="review-section" className="text-4xl font-black mb-10 gold-text uppercase tracking-tighter">Community Reviews</h2>
          <div className="space-y-6 mb-20">
            {isWatched && (
              <div className="glass-card p-8 border-gold-text/30 bg-gold-text/5 mb-10">
                <h3 className="text-xl font-bold mb-4 gold-text uppercase tracking-widest">Share Your Thoughts</h3>
                <form onSubmit={submitReview}>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your review here... How was the cinematography? The acting?"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-gold-text outline-none min-h-[120px] transition-all"
                  />
                  <div className="flex justify-end mt-4">
                    <button
                      type="submit"
                      disabled={isSubmittingReview || !reviewText.trim()}
                      className="px-8 py-3 bg-gold-text text-black rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Review'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {reviews.map((rev) => (
                  <div key={rev._id} className="glass-card p-6 border-white/5 hover:border-gold-text/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-text flex items-center justify-center text-black font-black text-sm uppercase overflow-hidden border-2 border-white/5">
                          {rev.profileImage ? (
                            <img src={rev.profileImage} alt={rev.characterName} className="w-full h-full object-cover" />
                          ) : (
                            rev.characterName?.[0]
                          )}
                        </div>
                        <div>
                          <p className="font-bold gold-text">@{rev.characterName}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-gold-text/10 px-3 py-1.5 rounded-lg border border-gold-text/20">
                        <Star className="w-4 h-4 text-gold-text fill-gold-text" />
                        <span className="font-black text-gold-text">{rev.rating}</span>
                      </div>
                    </div>
                    {rev.review && <p className="text-gray-300 leading-relaxed italic mt-4">"{rev.review}"</p>}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-6">
                      <button 
                        onClick={() => handleLike(rev._id)}
                        className={`flex items-center gap-2 transition-all hover:scale-110 ${rev.likes?.includes(user?.id) ? 'text-gold-text' : 'text-gray-500 hover:text-white'}`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${rev.likes?.includes(user?.id) ? 'fill-gold-text' : ''}`} />
                        <span className="text-xs font-bold">{rev.likes?.length || 0}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleDislike(rev._id)}
                        className={`flex items-center gap-2 transition-all hover:scale-110 ${rev.dislikes?.includes(user?.id) ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                      >
                        <ThumbsDown className={`w-4 h-4 ${rev.dislikes?.includes(user?.id) ? 'fill-white' : ''}`} />
                        <span className="text-xs font-bold">{rev.dislikes?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center glass-card border-dashed opacity-30">
                <p className="text-sm italic uppercase tracking-widest">No reviews yet. Be the first!</p>
              </div>
            )}
          </div>
          
          <h2 className="text-4xl font-black mb-10 gold-text uppercase tracking-tighter">Full Cast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-8">
            {movie.credits?.cast?.slice(0, 16).map(person => (
              <div key={person.id} className="group cursor-pointer">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4 border-2 border-transparent group-hover:border-gold-text transition-all duration-300 relative">
                  <img 
                    src={person.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : 'https://placehold.co/300x375/1a1a1a/ffd700?text=No+Photo'} 
                    alt={person.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                     <h4 className="font-bold text-md leading-tight text-white">{person.name}</h4>
                     <p className="text-xs text-gold-text mt-1 font-bold italic truncate">{person.character}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          <div className="glass-card p-10 border-white/5 bg-white/[0.02]">
            <h3 className="text-2xl font-black mb-8 gold-text uppercase tracking-widest">Movie Details</h3>
            <div className="space-y-8">
              <div>
                <p className="text-gray-500 uppercase text-xs font-black tracking-[0.2em] mb-2">Directed By</p>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-gold-text flex items-center justify-center text-black font-black">
                     {movie.credits?.crew?.find(c => c.job === 'Director')?.name?.[0]?.toUpperCase()}
                   </div>
                   <p className="text-xl font-bold">
                    {movie.credits?.crew?.find(c => c.job === 'Director')?.name || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-gray-500 uppercase text-xs font-black tracking-[0.2em] mb-2">Current Status</p>
                <p className="text-xl font-bold">{movie.status}</p>
              </div>
              {movie.budget > 0 && (
                <div>
                  <p className="text-gray-500 uppercase text-xs font-black tracking-[0.2em] mb-2">Production Budget</p>
                  <p className="text-xl font-bold text-green-500">${movie.budget?.toLocaleString()}</p>
                </div>
              )}
               {movie.revenue > 0 && (
                <div>
                  <p className="text-gray-500 uppercase text-xs font-black tracking-[0.2em] mb-2">Box Office Revenue</p>
                  <p className="text-xl font-bold text-green-500">${movie.revenue?.toLocaleString()}</p>
                </div>
              )}
              {movie.original_language && (
                 <div>
                   <p className="text-gray-500 uppercase text-xs font-black tracking-[0.2em] mb-2">Original Language</p>
                   <p className="text-xl font-bold uppercase">{movie.original_language}</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
