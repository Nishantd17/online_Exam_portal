import { Router } from 'express';
import { verifyJWT } from '../../middleware/auth.js';
import User from '../../models/User.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const router = Router();

router.use(verifyJWT);

router.get('/profile', (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, 'Profile retrieved successfully'));
});

router.patch('/profile', async (req, res, next) => {
  try {
    const { fullName, phone, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();
    const updated = await User.findById(user._id).select('-password');

    return res.status(200).json(new ApiResponse(200, updated, 'Profile updated successfully'));
  } catch (err) {
    next(err);
  }
});

export default router;
