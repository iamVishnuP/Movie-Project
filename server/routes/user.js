const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/search', authMiddleware, userController.searchUsers);
router.get('/profile/:id', authMiddleware, userController.getPublicProfile);
router.get('/connections/:id', authMiddleware, userController.getUserConnections);

module.exports = router;
