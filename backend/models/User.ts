import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  password?: string;
  bio?: string;
  motto?: string;
  interests: string[];
  domain?: string;
  skills: string[];
  profilePicture?: string;
  isVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  refreshTokens: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  motto: {
    type: String,
    default: ''
  },
  interests: [{
    type: String
  }],
  domain: {
    type: String,
    default: ''
  },
  skills: [{
    type: String
  }],
  profilePicture: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  refreshTokens: [{
    type: String
  }],
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
