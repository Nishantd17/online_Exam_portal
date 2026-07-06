import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils.js';
import { sendEmail } from '../utils/mailer.js';
import crypto from 'crypto';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, role, organization, phone } = req.body;

    if (!fullName || !email || !password) {
      throw new ApiError(400, 'Full name, email and password are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Verify email OTP registration record exists in DB and isVerified is true
    const otpRecord = await Otp.findOne({ email, isVerified: true });
    if (!otpRecord) {
      throw new ApiError(400, 'Email is not verified. Please verify your email first.');
    }

    // Creating user (will automatically hash password through User schema pre-save hook)
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'student',
      organization,
      phone,
      isVerified: true
    });

    // Delete verified OTP record so it cannot be reused
    await Otp.deleteMany({ email });

    const userResponse = await User.findById(user._id).select('-password');

    return res
      .status(201)
      .json(new ApiResponse(201, userResponse, 'User registered successfully'));
  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, 'Email address is required');
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Please enter a valid email address');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Rate limiting for resending OTP: check if there's a recent OTP sent to this email (less than 60 seconds ago)
    const existingOtp = await Otp.findOne({ email });
    if (existingOtp) {
      const timeDifference = Date.now() - new Date(existingOtp.createdAt).getTime();
      const waitTime = 60 * 1000; // 60 seconds
      if (timeDifference < waitTime) {
        const secondsLeft = Math.ceil((waitTime - timeDifference) / 1000);
        throw new ApiError(429, `Please wait ${secondsLeft} seconds before requesting another verification code.`);
      }
      // Delete the old OTP entry
      await Otp.deleteMany({ email });
    }

    // Generate random 6-digit OTP
    const otpVal = crypto.randomInt(100000, 1000000).toString();

    // Store in MongoDB
    await Otp.create({
      email,
      otp: otpVal,
      isVerified: false
    });

    // Send email using mailer utility
    const subject = 'Your ExamPortal Verification Code';
    const text = `Hello,\n\nYour 6-digit email verification code is: ${otpVal}\n\nThis code will expire in 5 minutes. If you did not request this code, please ignore this email.\n\nBest regards,\nExamPortal Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Verify Your Email Address</h2>
        <p>Hello,</p>
        <p>Thank you for signing up with ExamPortal. To complete your registration, please use the following 6-digit verification code:</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${otpVal}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code is valid for <strong>5 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated email. Please do not reply directly to this message.</p>
      </div>
    `;

    await sendEmail({ to: email, subject, html, text });

    return res.status(200).json(
      new ApiResponse(200, null, 'Verification code sent successfully')
    );
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ApiError(400, 'Email and OTP verification code are required');
    }

    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      throw new ApiError(400, 'Invalid verification code. Please check and try again.');
    }

    // Check if expired
    const timeDifference = Date.now() - new Date(otpRecord.createdAt).getTime();
    if (timeDifference > 5 * 60 * 1000) { // 5 minutes
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new ApiError(400, 'Verification code has expired. Please request a new one.');
    }

    // Mark as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    return res.status(200).json(
      new ApiResponse(200, { email }, 'Email verified successfully')
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    user.lastLogin = new Date();
    await user.save();

    const userWithoutPassword = await User.findById(user._id).select('-password');

    return res
      .status(200)
      .cookie('refreshToken', refreshToken, { ...cookieOptions, expires: expiresAt })
      .json(
        new ApiResponse(
          200,
          { user: userWithoutPassword, accessToken },
          'Logged in successfully'
        )
      );
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      // Find user and remove this token
      const user = await User.findOne({ 'refreshTokens.token': refreshToken });
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
        await user.save();
      }
    }

    return res
      .status(200)
      .clearCookie('refreshToken', cookieOptions)
      .json(new ApiResponse(200, {}, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, 'Refresh token is missing');
    }

    try {
      const decoded = verifyRefreshToken(incomingRefreshToken);
      const user = await User.findById(decoded._id);

      if (!user) {
        throw new ApiError(401, 'Invalid refresh token. User not found.');
      }

      // Check if token exists in user's refresh tokens list
      const activeToken = user.refreshTokens.find((t) => t.token === incomingRefreshToken);
      if (!activeToken) {
        // Token reuse detection! Clear all tokens if we suspect breach
        user.refreshTokens = [];
        await user.save();
        throw new ApiError(401, 'Refresh token has been reused or is invalid. Logged out.');
      }

      // Rotate tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Replace old refresh token with new one
      user.refreshTokens = user.refreshTokens.filter((t) => t.token !== incomingRefreshToken);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      user.refreshTokens.push({
        token: newRefreshToken,
        expiresAt,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });

      await user.save();

      return res
        .status(200)
        .cookie('refreshToken', newRefreshToken, { ...cookieOptions, expires: expiresAt })
        .json(
          new ApiResponse(
            200,
            { accessToken: newAccessToken },
            'Tokens rotated successfully'
          )
        );
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, 'No account found with this email address');
    }

    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    await user.save();

    console.log(`Password reset token generated: ${resetToken}`);
    console.log(`Reset link: http://localhost:5173/reset-password/${resetToken}`);

    return res
      .status(200)
      .json(new ApiResponse(200, { resetToken }, 'Password reset instructions printed in console. Use the token to reset.'));
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long');
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ApiError(400, 'Token is invalid or has expired');
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    
    // Clear active sessions
    user.refreshTokens = [];

    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Password reset successfully'));
  } catch (error) {
    next(error);
  }
};
