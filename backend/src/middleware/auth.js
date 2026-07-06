import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User.js';

export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, 'Unauthorized request. Access token is missing.');
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded._id).select('-password');

      if (!user) {
        throw new ApiError(401, 'Invalid Access Token. User not found.');
      }

      if (!user.isActive) {
        throw new ApiError(401, 'User account is deactivated.');
      }

      req.user = user;
      next();
    } catch (jwtError) {
      throw new ApiError(401, 'Unauthorized request. Access token has expired or is invalid.');
    }
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role (${req.user?.role || 'unknown'}) is not allowed to access this resource`)
      );
    }
    next();
  };
};
