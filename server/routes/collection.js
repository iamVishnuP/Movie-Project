const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, collectionController.getCollections);
router.post('/', authMiddleware, collectionController.createCollection);
router.post('/:id/add', authMiddleware, collectionController.addToCollection);
router.delete('/:id/remove/:movieId', authMiddleware, collectionController.removeFromCollection);
router.delete('/:id', authMiddleware, collectionController.deleteCollection);

module.exports = router;
