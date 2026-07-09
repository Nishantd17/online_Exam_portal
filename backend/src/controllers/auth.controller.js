import User from '../models/User.js';
import Otp from '../models/Otp.js';
import mongoose from 'mongoose';
import Organization from '../models/Organization.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils.js';
import { sendEmail } from '../utils/mailer.js';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

const generateUniqueJoinCode = async () => {
  let isUnique = false;
  let joinCode = '';
  while (!isUnique) {
    joinCode = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 characters
    const existing = await Organization.findOne({ joinCode });
    if (!existing) isUnique = true;
  }
  return joinCode;
};

const generateUniqueOrgId = async () => {
  let isUnique = false;
  let orgId = '';
  while (!isUnique) {
    orgId = 'ORG_' + Math.random().toString(36).substring(2, 8).toUpperCase(); // e.g. ORG_ABC123
    const existing = await Organization.findOne({ orgId });
    if (!existing) isUnique = true;
  }
  return orgId;
};

export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, role, organization, phone, joinCode } = req.body;

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

    let organizationId;
    let orgDoc;

    if (role === 'admin') {
      if (!organization) {
        throw new ApiError(400, 'Organization / Institution Name is required for Administrators');
      }
      const orgId = await generateUniqueOrgId();
      const code = await generateUniqueJoinCode();
      orgDoc = await Organization.create({
        name: organization.trim(),
        orgId,
        joinCode: code,
        createdBy: new mongoose.Types.ObjectId() // temporary ID, updated below
      });
      organizationId = orgDoc._id;
    } else {
      // student
      if (!joinCode) {
        throw new ApiError(400, 'Organization Join Code is required for Students');
      }
      const matchedOrg = await Organization.findOne({ joinCode: joinCode.trim().toUpperCase() });
      if (!matchedOrg) {
        throw new ApiError(400, 'Invalid Organization Code');
      }
      organizationId = matchedOrg._id;
    }

    // Creating user (will automatically hash password through User schema pre-save hook)
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'student',
      organizationId,
      phone,
      isVerified: true
    });

    // If Admin, update the Organization's createdBy back to actual Admin user ID
    if (role === 'admin' && orgDoc) {
      orgDoc.createdBy = user._id;
      await orgDoc.save();
    }

    // Delete verified OTP record so it cannot be reused
    await Otp.deleteMany({ email });

    const userResponse = await User.findById(user._id).select('-password').populate('organizationId');

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

    try {
      // Fire email in background so SMTP connection lags don't timeout the response
      sendEmail({ to: email, subject, html, text }).catch(err => {
        console.error("Background email sending error:", err.message);
      });
    } catch (err) {
      console.error("Email setup error:", err.message);
    }

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

    const userWithoutPassword = await User.findById(user._id).select('-password').populate('organizationId');

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

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const subject = 'Password Reset Request - ExamPortal';
    const text = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process within 10 minutes of receiving it:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to choose a new password. This link is valid for <strong>10 minutes</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #64748b; font-size: 14px;"><a href="${resetUrl}">${resetUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    // Send email using mailer utility
    await sendEmail({ to: email, subject, html, text });

    console.log(`Password reset token generated: ${resetToken}`);
    console.log(`Reset link: ${resetUrl}`);

    return res
      .status(200)
      .json(new ApiResponse(200, { resetToken }, 'Password reset instructions sent. Please check your email inbox.'));
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

const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new ApiError(400, 'Invalid Google ID token');
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      throw new ApiError(400, 'Google ID token is required');
    }

    const payload = await verifyGoogleToken(idToken);
    const { email, name, picture, email_verified } = payload;

    if (!email_verified) {
      throw new ApiError(400, 'Your Google email is not verified');
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (user) {
      // User exists -> Log them in!
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      user.refreshTokens.push({
        token: refreshToken,
        expiresAt,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });

      user.lastLogin = new Date();
      await user.save();

      const userWithoutPassword = await User.findById(user._id).select('-password').populate('organizationId');

      return res
        .status(200)
        .cookie('refreshToken', refreshToken, { ...cookieOptions, expires: expiresAt })
        .json(
          new ApiResponse(
            200,
            { user: userWithoutPassword, accessToken, isNewUser: false },
            'Logged in with Google successfully'
          )
        );
    } else {
      // User does not exist -> Tell frontend to complete signup details
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            isNewUser: true,
            email,
            fullName: name,
            avatar: picture
          },
          'Google authentication successful. Please complete your registration.'
        )
      );
    }
  } catch (error) {
    next(error);
  }
};

export const googleSignup = async (req, res, next) => {
  try {
    const { idToken, role, organization, joinCode, phone } = req.body;

    if (!idToken) {
      throw new ApiError(400, 'Google ID token is required');
    }

    if (!role) {
      throw new ApiError(400, 'Role is required');
    }

    const payload = await verifyGoogleToken(idToken);
    const { email, name, picture, email_verified } = payload;

    if (!email_verified) {
      throw new ApiError(400, 'Your Google email is not verified');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    let organizationId;
    let orgDoc;

    if (role === 'admin') {
      if (!organization) {
        throw new ApiError(400, 'Organization / Institution Name is required for Administrators');
      }
      const orgId = await generateUniqueOrgId();
      const code = await generateUniqueJoinCode();
      orgDoc = await Organization.create({
        name: organization.trim(),
        orgId,
        joinCode: code,
        createdBy: new mongoose.Types.ObjectId() // temporary ID, updated below
      });
      organizationId = orgDoc._id;
    } else {
      // student
      if (!joinCode) {
        throw new ApiError(400, 'Organization Join Code is required for Students');
      }
      const matchedOrg = await Organization.findOne({ joinCode: joinCode.trim().toUpperCase() });
      if (!matchedOrg) {
        throw new ApiError(400, 'Invalid Organization Code');
      }
      organizationId = matchedOrg._id;
    }

    // Generate a secure random password to satisfy schema requirement
    const randomPassword = crypto.randomBytes(24).toString('hex') + 'A1!'; // ensure complexity requirements

    // Creating user
    const user = await User.create({
      fullName: name,
      email,
      password: randomPassword,
      role: role || 'student',
      organizationId,
      phone,
      avatar: picture || '',
      isVerified: true
    });

    // If Admin, update the Organization's createdBy back to actual Admin user ID
    if (role === 'admin' && orgDoc) {
      orgDoc.createdBy = user._id;
      await orgDoc.save();
    }

    // Log the user in immediately
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    user.lastLogin = new Date();
    await user.save();

    const userWithoutPassword = await User.findById(user._id).select('-password').populate('organizationId');

    return res
      .status(201)
      .cookie('refreshToken', refreshToken, { ...cookieOptions, expires: expiresAt })
      .json(
        new ApiResponse(
          201,
          { user: userWithoutPassword, accessToken },
          'User registered and logged in with Google successfully'
        )
      );
  } catch (error) {
    next(error);
  }
};

