import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).trim(),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: passwordSchema,
  domain: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const resendOTPSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  bio: z.string().max(300).optional(),
  motto: z.string().max(100).optional(),
  domain: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  profilePicture: z.string().optional(),
  password: passwordSchema.optional(),
});

export const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  motto: z.string().max(100).optional(),
  domain: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});
