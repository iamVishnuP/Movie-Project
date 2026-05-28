const axios = require('axios');
const https = require('https');
const NodeCache = require('node-cache');
const User = require('../models/User');
const Review = require('../models/Review');

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

const dns = require('dns');

// Harden TMDB Fetcher: Custom Agent with forced IPv4 lookup
const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 20000,
  httpsAgent: new https.Agent({
    family: 4, 
    keepAlive: false,
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, (err, address, family) => {
        callback(err, address, family);
      });
    }
  }),
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

console.log('[TMDB] Fetcher initialized with forced IPv4 DNS lookup');

const API_KEY = process.env.TMDB_API_KEY;

const fallbackMovies = [
  { id: 101, title: 'Inception', poster_path: '/edv5CZvYjY9S96oCcZli9701t2u.jpg', overview: 'A thief who steals corporate secrets through the use of dream-sharing technology.', release_date: '2010-07-15', vote_average: 8.8 },
  { id: 102, title: 'Interstellar', poster_path: '/gEU2QniE6KcfyPZfsfzcbvYvpwB.jpg', overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', release_date: '2014-11-05', vote_average: 8.7 },
  { id: 103, title: 'The Dark Knight', poster_path: '/qJ2tW69R7S3VFGjrSmsbuH9S0pA.jpg', overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham.', release_date: '2008-07-16', vote_average: 9.0 }
];

const fallbackDirectors = [
  { id: 525, name: 'Christopher Nolan', profile_path: '/lU9Y78UrS7ZZoB6S79RAt9u4992.jpg', known_for_department: 'Directing' },
  { id: 488, name: 'Steven Spielberg', profile_path: '/mS9ZfbeD5fbeR20N46S80L7h06U.jpg', known_for_department: 'Directing' },
  { id: 1032, name: 'Martin Scorsese', profile_path: '/9U9SOfSOfSOfSOfSOfSOfSOfSOf.jpg', known_for_department: 'Directing' },
  { id: 138, name: 'Quentin Tarantino', profile_path: '/19770519/tarantino.jpg', known_for_department: 'Directing' }
];

const fetchFromTMDB = async (endpoint, params = {}, retries = 5) => {
  const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  for (let i = 0; i < retries; i++) {
    try {
      const response = await tmdbClient.get(endpoint, {
        params: { api_key: API_KEY, ...params }
      });
      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const isNetworkError = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.message.includes('timeout');
      
      if (isNetworkError && i < retries - 1) {
        const backoffTime = (1000 * (i + 1)) + Math.random() * 1000;
        console.log(`[TMDB] ${error.code || 'TIMEOUT'} on ${endpoint}. Retry ${i + 1}/${retries} in ${Math.round(backoffTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      console.error(`TMDB API Final Error on ${endpoint}:`, error.message);
      
      // Graceful fallback dummy data so UI doesn't break
      console.log('Sending fallback dummy data to frontend...');
      if (endpoint === '/search/person') {
        return { results: fallbackDirectors.filter(d => !params.query || d.name.toLowerCase().includes(params.query.toLowerCase())) };
      }
      
      if (endpoint.includes('/credits') || endpoint.includes('/videos')) {
        return endpoint.includes('/credits') ? { cast: [] } : { results: [] };
      }
      
      if (endpoint.includes('/release_dates')) {
        return { results: [] };
      }
      
      let mockData;
      if (endpoint === '/search/movie') {
        mockData = {
          results: fallbackMovies.filter(m => !params.query || m.title.toLowerCase().includes(params.query.toLowerCase()))
        };
      } else {
        const isSingleMovie = endpoint.match(/^\/movie\/\d+$/);
        mockData = isSingleMovie ? { ...fallbackMovies[0], runtime: 120, genres: [], credits: { cast: [] }, videos: { results: [] } } : { results: fallbackMovies };
      }
      
      return mockData;
    }
  }
};

const fetchMoviesWithLanguages = async (endpoint, baseParams, languages, pagesToFetch = 1) => {
  let allResults = [];
  const langs = languages && languages.length > 0 ? languages : [''];

  for (let page = 1; page <= pagesToFetch; page++) {
    const pagePromises = langs.map(lang => {
      const params = { ...baseParams, page };
      if (lang) {
        params.with_original_language = lang;
      }
      return fetchFromTMDB(endpoint, params);
    });

    const pageResults = await Promise.all(pagePromises);
    
    // Interleave the results so movies from different languages are mixed evenly
    const maxLen = Math.max(...pageResults.map(res => res.results?.length || 0));
    for (let i = 0; i < maxLen; i++) {
        for (const res of pageResults) {
            if (res.results && res.results[i]) {
                const isDuplicate = allResults.some(m => m.id === res.results[i].id);
                if (!isDuplicate) {
                    allResults.push(res.results[i]);
                }
            }
        }
    }
  }

  return allResults;
};

exports.getUpcoming = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let params = {
      'primary_release_date.gte': today, // Shows only future or today's releases
      'sort_by': 'primary_release_date.asc',
      'include_adult': false
    };

    const pagesToFetch = req.query.fetchAll === 'true' ? 5 : 1;
    let languages = [];

    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user && user.selectedLanguages?.length > 0) {
        languages = user.selectedLanguages;
      }
    }

    const movies = await fetchMoviesWithLanguages('/discover/movie', params, languages, pagesToFetch);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNowPlaying = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    let params = {
      'primary_release_date.lte': todayStr,
      'primary_release_date.gte': thirtyDaysAgoStr,
      'sort_by': 'popularity.desc',
      'include_adult': false
    };

    const pagesToFetch = req.query.fetchAll === 'true' ? 5 : 1;
    let languages = [];

    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user && user.selectedLanguages?.length > 0) {
        languages = user.selectedLanguages;
      }
    }

    const movies = await fetchMoviesWithLanguages('/discover/movie', params, languages, pagesToFetch);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMovieDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await fetchFromTMDB(`/movie/${id}`);
    const credits = await fetchFromTMDB(`/movie/${id}/credits`);
    const videos = await fetchFromTMDB(`/movie/${id}/videos`);
    const releaseDates = await fetchFromTMDB(`/movie/${id}/release_dates`);
    res.json({ ...movie, credits, videos, release_dates: releaseDates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMovieVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const videos = await fetchFromTMDB(`/movie/${id}/videos`);
    res.json(videos.results || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchMovies = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);
    const data = await fetchFromTMDB('/search/movie', {
      query,
      include_adult: false,
    });
    res.json(data.results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchPersons = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);
    const data = await fetchFromTMDB('/search/person', {
      query,
      include_adult: false,
    });
    res.json(data.results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const pagesToFetch = req.query.fetchAll === 'true' ? 5 : 1;
    const { selectedGenres, selectedLanguages, favoriteDirectors, favoriteMovies } = user;
    const recommendationSections = [];

    const fetchPages = async (endpoint, params) => {
        let movies = [];
        for(let p=1; p<=pagesToFetch; p++){
            const pRes = await fetchFromTMDB(endpoint, {...params, page: p});
            movies = movies.concat(pRes.results || []);
        }
        return movies;
    };

    // 1. Based on Genres
    if (selectedGenres && selectedGenres.length > 0) {
      const movies = await fetchPages('/discover/movie', {
        with_genres: selectedGenres.join('|'),
        sort_by: 'popularity.desc'
      });
      recommendationSections.push({
        title: 'Based on your genres',
        movies: movies
      });
    }

    // 2. Based on Languages
    if (selectedLanguages && selectedLanguages.length > 0) {
      const movies = await fetchMoviesWithLanguages('/discover/movie', { sort_by: 'popularity.desc' }, selectedLanguages, pagesToFetch);
      recommendationSections.push({
        title: 'In your preferred languages',
        movies: movies
      });
    }

    // 3. Based on Directors
    if (favoriteDirectors && favoriteDirectors.length > 0) {
      for (const director of favoriteDirectors.slice(0, 2)) {
        const movies = await fetchPages('/discover/movie', {
          with_crew: director.id,
          sort_by: 'popularity.desc'
        });
        if (movies?.length > 0) {
          recommendationSections.push({
            title: `Directed by ${director.name}`,
            movies: movies
          });
        }
      }
    }

    // 4. Similar to Favorites
    if (favoriteMovies && favoriteMovies.length > 0) {
      const fav = favoriteMovies[Math.floor(Math.random() * favoriteMovies.length)];
      let movies = [];
      for (let p = 1; p <= Math.min(pagesToFetch, 3); p++) {
        const res = await fetchFromTMDB(`/movie/${fav.id}/similar`, { page: p });
        movies = movies.concat(res.results || []);
      }
      recommendationSections.push({
        title: `Because you liked ${fav.title}`,
        movies: movies
      });
    }

    // Fallback if nothing
    if (recommendationSections.length === 0) {
      const movies = await fetchPages('/movie/popular', {});
      recommendationSections.push({
        title: 'Popular on MovieHub',
        movies: movies
      });
    }

    res.json(recommendationSections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToWatchlist = async (req, res) => {
  try {
    const { movieId, title, posterPath } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.watchlist.some(m => m.movieId === movieId)) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }

    user.watchlist.push({ movieId, title, posterPath });
    await user.save();
    res.json({ message: 'Movie added to watchlist', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.watchlist = user.watchlist.filter(m => m.movieId !== movieId);
    await user.save();
    res.json({ message: 'Movie removed from watchlist', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsWatched = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { title, posterPath } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let movie = user.watchlist.find(m => m.movieId === movieId);
    if (movie) {
      movie.status = 'watched';
    } else {
      user.watchlist.push({ 
        movieId, 
        title: title || 'Unknown Title', 
        posterPath: posterPath || '', 
        status: 'watched' 
      });
    }
    
    user.markModified('watchlist');
    await user.save();
    res.json({ message: 'Movie marked as watched', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rateMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { rating, reviewText } = req.body;
    console.log(`Rating movie ${movieId} with rating ${rating}`);
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const movie = user.watchlist.find(m => m.movieId === movieId);
    if (!movie) {
      console.log(`Movie ${movieId} not found in watchlist for user ${user.email}`);
      return res.status(404).json({ message: 'Movie not in watchlist' });
    }

    movie.rating = rating;
    if (reviewText !== undefined) {
      movie.review = reviewText;
    }
    
    user.markModified('watchlist');
    await user.save();

    // Update global review collection - always do this if there's a rating
    if (rating >= 1) {
      const reviewData = { 
        rating, 
        review: reviewText || "", 
        characterName: user.characterName || 'Anonymous',
        profileImage: user.profileImage || "",
        movieTitle: movie.title || 'Unknown'
      };
      console.log('Upserting review:', reviewData);
      
      await Review.findOneAndUpdate(
        { userId: user.id, movieId },
        reviewData,
        { upsert: true, new: true }
      );
    }

    console.log('Movie rated successfully');
    res.json({ message: 'Movie rated successfully', watchlist: user.watchlist });
  } catch (error) {
    console.error('Error rating movie:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.removeRating = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    // 1. Clear from user's watchlist
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const movie = user.watchlist.find(m => m.movieId === movieId);
    if (movie) {
      movie.rating = 0;
      delete movie.review;
      user.markModified('watchlist');
      await user.save();
    }

    // 2. Delete from global Review collection
    await Review.findOneAndDelete({ userId, movieId });

    res.json({ message: 'Rating and review removed', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Toggle like
    if (review.likes.includes(userId)) {
      review.likes = review.likes.filter(id => id.toString() !== userId);
    } else {
      review.likes.push(userId);
      // Remove dislike if it exists
      review.dislikes = review.dislikes.filter(id => id.toString() !== userId);
    }

    await review.save();
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.dislikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Toggle dislike
    if (review.dislikes.includes(userId)) {
      review.dislikes = review.dislikes.filter(id => id.toString() !== userId);
    } else {
      review.dislikes.push(userId);
      // Remove like if it exists
      review.likes = review.likes.filter(id => id.toString() !== userId);
    }

    await review.save();
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
