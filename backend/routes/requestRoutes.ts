import { Router } from 'express';
import {
  getMyRequests,
  sendJoinRequest,
  sendInvite,
  respondToRequest,
} from '../controllers/requestController';
import { protect } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', protect, getMyRequests);
router.post('/join', protect, sendJoinRequest);
router.post('/invite', protect, checkRole(['Owner', 'Admin']), sendInvite);
router.put('/:requestId', protect, respondToRequest);

export default router;
