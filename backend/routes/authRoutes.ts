import { Router } from 'express';
import {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../utils/validators';

const router = Router();

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/verify-otp', validateRequest(verifyOTPSchema), verifyOTP);
router.post('/resend-otp', validateRequest(resendOTPSchema), resendOTP);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validateRequest(resetPasswordSchema), resetPassword);
router.get('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validateRequest(updateProfileSchema), updateUserProfile);

export default router;
