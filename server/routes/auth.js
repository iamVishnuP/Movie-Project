const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/signin', authController.signin);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getMe);
router.post('/update-profile', authMiddleware, authController.updateProfile);
router.delete('/delete-account', authMiddleware, authController.deleteAccount);

module.exports = router;
