import { Router } from 'express';
import {
  signup,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
  googleAuth,
  googleSignup
} from '../../controllers/auth.controller.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

const sendOtpLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 requests per 5 minutes
  message: 'Too many verification code requests from this IP, please try again after 5 minutes.'
});

const verifyOtpLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 verification requests per 5 minutes
  message: 'Too many verification attempts from this IP, please try again after 5 minutes.'
});

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/send-otp', sendOtpLimiter, sendOtp);
router.post('/verify-otp', verifyOtpLimiter, verifyOtp);
router.post('/google', googleAuth);
router.post('/google/signup', googleSignup);

export default router;
