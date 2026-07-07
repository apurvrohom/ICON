import { Router, Response } from 'express';
import Message from '../models/Message';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/roleMiddleware';

const router = Router({ mergeParams: true });

router.get(
  '/',
  protect,
  checkRole(['Owner', 'Admin', 'Member', 'Viewer']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const before = req.query.before as string | undefined;

      const queryObj: any = {
        chatId: req.params.projectId,
        chatModel: 'Project'
      };

      if (before) {
        queryObj.createdAt = { $lt: new Date(before) };
      }

      const messages = await Message.find(queryObj)
        .populate('sender', 'username name profilePicture')
        .sort({ createdAt: -1 }) // Get most recent first for pagination
        .limit(limit);

      // Reverse so they are returned in chronological order
      res.json(messages.reverse());
    } catch (error: any) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

export default router;
