import { Router } from 'express';
import {
  getWorkspaceByProjectId,
  addNote,
  updateNote,
  addResource,
} from '../controllers/workspaceController';
import { protect } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/roleMiddleware';

const router = Router({ mergeParams: true });

router.route('/')
  .get(protect, checkRole(['Owner', 'Admin', 'Member', 'Viewer']), getWorkspaceByProjectId);

router.route('/notes')
  .post(protect, checkRole(['Owner', 'Admin', 'Member']), addNote)
  .put(protect, checkRole(['Owner', 'Admin', 'Member']), updateNote);

router.route('/resources')
  .post(protect, checkRole(['Owner', 'Admin', 'Member']), addResource);

export default router;
