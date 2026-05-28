const axios = require('axios');
const https = require('https');
const NodeCache = require('node-cache');
const { db, admin } = require('../utils/firebase');
const dns = require('dns');

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

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
      const userDoc = await db.collection('users').doc(req.user.id).get();
      if (userDoc.exists) {
        const user = userDoc.data();
        if (user.selectedLanguages?.length > 0) {
          languages = user.selectedLanguages;
        }
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
      const userDoc = await db.collection('users').doc(req.user.id).get();
      if (userDoc.exists) {
        const user = userDoc.data();
        if (user.selectedLanguages?.length > 0) {
          languages = user.selectedLanguages;
        }
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

const languageMap = {
  'english': 'en',
  'malayalam': 'ml',
  'hindi': 'hi',
  'tamil': 'ta',
  'telugu': 'te',
  'kannada': 'kn',
  'spanish': 'es',
  'french': 'fr',
  'japanese': 'ja',
  'korean': 'ko'
};

exports.searchMovies = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const q = query.toLowerCase().trim();
    let results = [];

    // 1. Detect Language Search (e.g. "malayalam movies", "hindi movies")
    const langMatch = q.match(/^([a-z]+)\s+movies$/);
    if (langMatch && languageMap[langMatch[1]]) {
      const data = await fetchFromTMDB('/discover/movie', {
        with_original_language: languageMap[langMatch[1]],
        sort_by: 'popularity.desc'
      });
      return res.json(data.results);
    }

    // 2. Detect Director Search (e.g. "christopher nolan movies", "movies by nolan")
    const directorMatch = q.match(/(?:movies\s+(?:by|from)\s+|([a-z\s]+)\s+movies)/);
    if (directorMatch) {
      const directorName = directorMatch[1] || q.replace(/movies\s+(?:by|from)\s+/, '');
      const personData = await fetchFromTMDB('/search/person', { query: directorName });
      const director = personData.results?.find(p => p.known_for_department === 'Directing');
      
      if (director) {
        const data = await fetchFromTMDB('/discover/movie', {
          with_crew: director.id,
          sort_by: 'popularity.desc'
        });
        return res.json(data.results);
      }
    }

    // 3. Standard Search with User Context Boost
    const data = await fetchFromTMDB('/search/movie', { query, include_adult: false });
    results = data.results || [];

    if (req.user && results.length > 0) {
      const userDoc = await db.collection('users').doc(req.user.id).get();
      if (userDoc.exists) {
        const { selectedGenres, selectedLanguages } = userDoc.data();
        
        // Boost results that match user preferences
        results.sort((a, b) => {
          let aScore = 0;
          let bScore = 0;
          
          if (selectedLanguages?.includes(a.original_language)) aScore += 2;
          if (selectedLanguages?.includes(b.original_language)) bScore += 2;
          
          if (a.genre_ids?.some(id => selectedGenres?.includes(id))) aScore += 1;
          if (b.genre_ids?.some(id => selectedGenres?.includes(id))) bScore += 1;
          
          return bScore - aScore;
        });
      }
    }

    res.json(results);
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
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();

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
    const userRef = db.collection('users').doc(req.user.id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    const watchlist = user.watchlist || [];

    if (watchlist.some(m => m.movieId === movieId)) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }

    const newMovie = { movieId, title, posterPath, status: 'pending' };
    await userRef.update({
      watchlist: admin.firestore.FieldValue.arrayUnion(newMovie)
    });
    
    watchlist.push(newMovie);
    res.json({ message: 'Movie added to watchlist', watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userRef = db.collection('users').doc(req.user.id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const user = userDoc.data();
    const watchlist = user.watchlist || [];

    const movieToRemove = watchlist.find(m => m.movieId === movieId);
    if (movieToRemove) {
      await userRef.update({
        watchlist: admin.firestore.FieldValue.arrayRemove(movieToRemove)
      });
      const newWatchlist = watchlist.filter(m => m.movieId !== movieId);
      res.json({ message: 'Movie removed from watchlist', watchlist: newWatchlist });
    } else {
      res.json({ message: 'Movie not found in watchlist', watchlist });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsWatched = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { title, posterPath } = req.body;
    const userRef = db.collection('users').doc(req.user.id);
    
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');
      
      const user = userDoc.data();
      let watchlist = user.watchlist || [];
      const movieIndex = watchlist.findIndex(m => m.movieId === movieId);
      
      if (movieIndex > -1) {
        watchlist[movieIndex].status = 'watched';
      } else {
        watchlist.push({ 
          movieId, 
          title: title || 'Unknown Title', 
          posterPath: posterPath || '', 
          status: 'watched' 
        });
      }
      
      t.update(userRef, { watchlist });
    });
    
    const updatedUserDoc = await userRef.get();
    res.json({ message: 'Movie marked as watched', watchlist: updatedUserDoc.data().watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rateMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { rating, reviewText } = req.body;
    console.log(`Rating movie ${movieId} with rating ${rating}`);
    
    const userId = req.user.id;
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');
      
      const user = userDoc.data();
      let watchlist = user.watchlist || [];
      const movieIndex = watchlist.findIndex(m => m.movieId === movieId);
      
      if (movieIndex === -1) {
        throw new Error('Movie not in watchlist');
      }
      
      watchlist[movieIndex].rating = rating;
      if (reviewText !== undefined) {
        watchlist[movieIndex].review = reviewText;
      }
      
      // Prepare review update if needed
      let reviewUpdate = null;
      if (rating >= 1) {
        const reviewRef = db.collection('reviews').doc(`${userId}_${movieId}`);
        const reviewDoc = await t.get(reviewRef);
        
        const reviewData = { 
          userId,
          movieId,
          rating, 
          review: reviewText || "", 
          characterName: user.characterName || 'Anonymous',
          profileImage: user.profileImage || "",
          movieTitle: watchlist[movieIndex].title || 'Unknown',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (!reviewDoc.exists) {
          reviewUpdate = { 
            ref: reviewRef, 
            type: 'set', 
            data: { 
              ...reviewData, 
              likes: [], 
              dislikes: [], 
              createdAt: admin.firestore.FieldValue.serverTimestamp() 
            } 
          };
        } else {
          reviewUpdate = { ref: reviewRef, type: 'update', data: reviewData };
        }
      }

      // Now perform all writes
      t.update(userRef, { watchlist });
      
      if (reviewUpdate) {
        if (reviewUpdate.type === 'set') {
          t.set(reviewUpdate.ref, reviewUpdate.data);
        } else {
          t.update(reviewUpdate.ref, reviewUpdate.data);
        }
      }

    });

    const updatedUserDoc = await userRef.get();
    console.log('Movie rated successfully');
    res.json({ message: 'Movie rated successfully', watchlist: updatedUserDoc.data().watchlist });
  } catch (error) {
    console.error('Error rating movie:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.removeRating = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');
      
      const user = userDoc.data();
      let watchlist = user.watchlist || [];
      const movieIndex = watchlist.findIndex(m => m.movieId === movieId);
      
      if (movieIndex > -1) {
        watchlist[movieIndex].rating = 0;
        delete watchlist[movieIndex].review;
        t.update(userRef, { watchlist });
      }
      
      const reviewRef = db.collection('reviews').doc(`${userId}_${movieId}`);
      t.delete(reviewRef);
    });

    const updatedUserDoc = await userRef.get();
    res.json({ message: 'Rating removed successfully', watchlist: updatedUserDoc.data().watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReviewText = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');
      
      const user = userDoc.data();
      let watchlist = user.watchlist || [];
      // Use loose equality or string conversion to handle string/number IDs
      const movieIndex = watchlist.findIndex(m => String(m.movieId) === String(movieId));
      
      if (movieIndex > -1) {
        // Prepare writes
        const reviewRef = db.collection('reviews').doc(`${userId}_${movieId}`);
        const reviewDoc = await t.get(reviewRef);
        
        // Update watchlist
        watchlist[movieIndex].review = "";
        t.update(userRef, { watchlist });
        
        // Update review doc if it exists
        if (reviewDoc.exists) {
          t.update(reviewRef, { 
            review: "",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    });

    const updatedUserDoc = await userRef.get();
    res.json({ message: 'Review text deleted successfully', watchlist: updatedUserDoc.data().watchlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const snapshot = await db.collection('reviews')
      .where('movieId', '==', movieId)
      .orderBy('createdAt', 'desc')
      .get();
      
    const reviews = [];
    snapshot.forEach(doc => reviews.push({ _id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const reviewRef = db.collection('reviews').doc(reviewId);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(reviewRef);
      if (!doc.exists) throw new Error('Review not found');
      
      const review = doc.data();
      let likes = review.likes || [];
      let dislikes = review.dislikes || [];
      
      if (likes.includes(userId)) {
        likes = likes.filter(id => id !== userId);
      } else {
        likes.push(userId);
        dislikes = dislikes.filter(id => id !== userId);
      }
      
      t.update(reviewRef, { likes, dislikes });
    });
    
    const updatedDoc = await reviewRef.get();
    res.json({ _id: reviewId, ...updatedDoc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.dislikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const reviewRef = db.collection('reviews').doc(reviewId);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(reviewRef);
      if (!doc.exists) throw new Error('Review not found');
      
      const review = doc.data();
      let likes = review.likes || [];
      let dislikes = review.dislikes || [];
      
      if (dislikes.includes(userId)) {
        dislikes = dislikes.filter(id => id !== userId);
      } else {
        dislikes.push(userId);
        likes = likes.filter(id => id !== userId);
      }
      
      t.update(reviewRef, { likes, dislikes });
    });
    
    const updatedDoc = await reviewRef.get();
    res.json({ _id: reviewId, ...updatedDoc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    res.json(userDoc.data().watchlist || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
