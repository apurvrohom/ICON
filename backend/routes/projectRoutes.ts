import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  addMember,
} from '../controllers/projectController';
import { protect } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/roleMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { projectSchema } from '../utils/validators';

const router = Router();

router.route('/')
  .post(protect, validateRequest(projectSchema), createProject)
  .get(protect, getProjects);

router.route('/:id')
  .get(protect, getProjectById);

router.route('/:projectId')
  .put(protect, checkRole(['Owner', 'Admin']), updateProject);

router.route('/:projectId/members')
  .post(protect, checkRole(['Owner', 'Admin']), addMember);

export default router;
