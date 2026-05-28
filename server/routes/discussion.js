const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, discussionController.createDiscussion);
router.put('/respond/:id', authMiddleware, discussionController.respondToInvite);
router.get('/my-discussions', authMiddleware, discussionController.getUserDiscussions);
router.get('/public', authMiddleware, discussionController.getPublicDiscussions);
router.get('/trending', authMiddleware, discussionController.getTrendingRooms);
router.get('/search', authMiddleware, discussionController.searchRoomsByMovie);
router.get('/:id', authMiddleware, discussionController.getDiscussion);
router.post('/post', authMiddleware, discussionController.createPost);
router.post('/react', authMiddleware, discussionController.reactToPost);
router.post('/leave/:id', authMiddleware, discussionController.leaveDiscussion);
router.post('/:id/seen', authMiddleware, discussionController.seenDiscussion);
router.delete('/:id', authMiddleware, discussionController.deleteDiscussion);

module.exports = router;
