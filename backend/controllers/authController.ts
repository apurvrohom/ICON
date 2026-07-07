import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendOTPEmail, sendResetPasswordEmail } from '../utils/mailer';
import { AuthRequest } from '../middleware/authMiddleware';

const generateAccessToken = (id: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: '15m', // Short-lived access token
  });
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { username, name, email, password, domain, skills, interests } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (userExists) {
      res.status(400).json({ message: 'Username or email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      domain,
      skills,
      interests,
      isVerified: true,
      refreshTokens: [],
    });

    if (user) {
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken();
      user.refreshTokens.push(refreshToken);
      await user.save();

      setRefreshTokenCookie(res, refreshToken);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        token: accessToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  res.status(400).json({ message: 'OTP verification is disabled' });
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  res.status(400).json({ message: 'OTP verification is disabled' });
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken();

    // Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      token: accessToken,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  const cookies = req.cookies;

  if (!cookies || !cookies.refreshToken) {
    res.status(401).json({ message: 'No refresh token provided' });
    return;
  }

  const clientRefreshToken = cookies.refreshToken;

  try {
    const user = await User.findOne({ refreshTokens: clientRefreshToken });

    if (!user) {
      res.status(403).json({ message: 'Invalid refresh token - reuse detected or token revoked' });
      return;
    }

    // Rotate refresh token: filter out the old one and add a new one
    user.refreshTokens = user.refreshTokens.filter((token) => token !== clientRefreshToken);
    const newRefreshToken = generateRefreshToken();
    user.refreshTokens.push(newRefreshToken);

    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    const accessToken = generateAccessToken(user._id.toString());
    res.json({ token: accessToken });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during token refresh', error: error.message });
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  const cookies = req.cookies;
  if (!cookies || !cookies.refreshToken) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
    return;
  }

  const clientRefreshToken = cookies.refreshToken;

  try {
    const user = await User.findOne({ refreshTokens: clientRefreshToken });
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((token) => token !== clientRefreshToken);
      await user.save();
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal user existence
      res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save();

    // Frontend URL reset link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    await sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during forgot password', error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired password reset token' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Revoke all existing refresh sessions on password change
    user.refreshTokens = [];

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during password reset', error: error.message });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio || user.bio;
      user.motto = req.body.motto || user.motto;
      user.domain = req.body.domain || user.domain;
      user.skills = req.body.skills || user.skills;
      user.interests = req.body.interests || user.interests;
      user.profilePicture = req.body.profilePicture || user.profilePicture;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        // Revoke other refresh tokens on security change
        user.refreshTokens = [];
      }

      const updatedUser = await user.save();
      const accessToken = generateAccessToken(updatedUser._id.toString());

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        token: accessToken,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during profile update', error: error.message });
  }
};
