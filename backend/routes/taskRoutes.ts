import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  toggleTaskChecklist,
  addTaskChecklistItem,
  deleteTaskChecklistItem,
} from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/roleMiddleware';

const router = Router({ mergeParams: true });

router.route('/')
  .get(protect, checkRole(['Owner', 'Admin', 'Member', 'Viewer']), getTasks)
  .post(protect, checkRole(['Owner', 'Admin', 'Member']), createTask);

router.route('/:id')
  .put(protect, checkRole(['Owner', 'Admin', 'Member']), updateTask)
  .delete(protect, checkRole(['Owner', 'Admin', 'Member']), deleteTask);

router.route('/:id/comments')
  .post(protect, checkRole(['Owner', 'Admin', 'Member']), addTaskComment);

router.route('/:id/checklist')
  .post(protect, checkRole(['Owner', 'Admin', 'Member']), addTaskChecklistItem);

router.route('/:id/checklist/:itemId')
  .put(protect, checkRole(['Owner', 'Admin', 'Member']), toggleTaskChecklist)
  .delete(protect, checkRole(['Owner', 'Admin', 'Member']), deleteTaskChecklistItem);

export default router;
