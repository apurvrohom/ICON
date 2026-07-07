import { Response, NextFunction } from 'express';
import Project from '../models/Project';
import { AuthRequest } from './authMiddleware';

export const checkRole = (allowedRoles: ('Owner' | 'Admin' | 'Member' | 'Viewer')[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.projectId || req.params.id || req.body.projectId;
      if (!projectId) {
        res.status(400).json({ message: 'Project ID is required' });
        return;
      }

      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const userIdStr = req.user._id.toString();

      // Check if user is the creator of the project -> Owner role
      const isCreator = project.creator.toString() === userIdStr;

      if (isCreator) {
        if (allowedRoles.includes('Owner') || allowedRoles.includes('Admin')) {
          return next();
        }
      }

      // Check member list
      const member = project.members.find((m) => m.user.toString() === userIdStr);
      if (!member) {
        res.status(403).json({ message: 'Access denied: Not a member of this project' });
        return;
      }

      if (!allowedRoles.includes(member.role)) {
        res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ message: 'RBAC Server error', error: error.message });
    }
  };
};
