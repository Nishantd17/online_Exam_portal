import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: '15m'
    }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      _id: user._id
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d'
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
