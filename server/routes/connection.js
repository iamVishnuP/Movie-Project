const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/request', authMiddleware, connectionController.sendRequest);
router.put('/respond/:id', authMiddleware, connectionController.respondToRequest);
router.get('/my-connections', authMiddleware, connectionController.getMyConnections);

router.delete('/remove/:id', authMiddleware, connectionController.removeConnection);

module.exports = router;
