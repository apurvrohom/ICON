import { Router } from 'express';
import { searchUsers, getUserById } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/').get(protect, searchUsers);
router.route('/:id').get(protect, getUserById);

export default router;
