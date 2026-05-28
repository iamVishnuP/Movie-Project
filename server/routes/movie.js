const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

router.get('/upcoming', optionalAuth, movieController.getUpcoming);
router.get('/now-playing', optionalAuth, movieController.getNowPlaying);
router.get('/search', movieController.searchMovies);
router.get('/search/person', movieController.searchPersons);
router.get('/detail/:id', movieController.getMovieDetail);
router.get('/videos/:id', movieController.getMovieVideos);
router.get('/recommendations', authMiddleware, movieController.getRecommendations);
router.post('/watchlist/add', authMiddleware, movieController.addToWatchlist);
router.delete('/watchlist/remove/:movieId', authMiddleware, movieController.removeFromWatchlist);
router.put('/watchlist/watched/:movieId', authMiddleware, movieController.markAsWatched);
router.put('/watchlist/rate/:movieId', authMiddleware, movieController.rateMovie);
router.delete('/watchlist/rate/:movieId', authMiddleware, movieController.removeRating);
router.get('/watchlist', authMiddleware, movieController.getWatchlist);
router.get('/detail/:movieId/reviews', movieController.getMovieReviews);
router.post('/reviews/:reviewId/like', authMiddleware, movieController.likeReview);
router.post('/reviews/:reviewId/dislike', authMiddleware, movieController.dislikeReview);

module.exports = router;
