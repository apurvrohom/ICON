import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const searchStr = req.query.search as string | undefined;
  const keyword = searchStr
    ? {
        $or: [
          { name: { $regex: searchStr, $options: 'i' } },
          { username: { $regex: searchStr, $options: 'i' } },
          { domain: { $regex: searchStr, $options: 'i' } },
        ],
      }
    : {};

  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const users = await User.find(keyword)
      .find({ _id: { $ne: req.user._id } })
      .select('-password');
    
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
