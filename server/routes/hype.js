const express = require('express');
const router = express.Router();
const hypeController = require('../controllers/hypeController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

router.post('/toggle', authMiddleware, hypeController.toggleHype);
router.get('/stats', optionalAuth, hypeController.getHypeStats);
router.get('/all', hypeController.getAllHypes);

module.exports = router;
