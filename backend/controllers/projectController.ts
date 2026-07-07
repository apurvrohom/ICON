import { Response } from 'express';
import Project from '../models/Project';
import Workspace from '../models/Workspace';
import { AuthRequest } from '../middleware/authMiddleware';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, motto, domain, tags, isPublic } = req.body;

  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.create({
      name,
      description,
      motto,
      domain,
      tags,
      isPublic,
      creator: req.user._id,
      members: [{ user: req.user._id, role: 'Owner' }] // Creator is the Owner
    });

    // Auto-create workspace
    const workspace = await Workspace.create({
      project: project._id,
      notes: [],
      resources: []
    });

    project.workspace = workspace._id as any;
    await project.save();

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const projects = await Project.find({
      $or: [
        { isPublic: true },
        { creator: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).populate('creator', 'username name').sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findById(req.params.id)
      .populate('creator', 'username name profilePicture')
      .populate('members.user', 'username name profilePicture')
      .populate('workspace');

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Check visibility
    const isMember = project.creator.toString() === req.user._id.toString() || 
                     project.members.some(m => m.user?._id?.toString() === req.user?._id?.toString());
                     
    if (!project.isPublic && !isMember) {
      res.status(403).json({ message: 'Private project access denied' });
      return;
    }

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    project.motto = req.body.motto || project.motto;
    project.domain = req.body.domain || project.domain;
    project.tags = req.body.tags || project.tags;
    project.isPublic = req.body.isPublic !== undefined ? req.body.isPublic : project.isPublic;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, role } = req.body;
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const alreadyMember = project.members.find(m => m.user.toString() === userId);
    if (alreadyMember) {
      res.status(400).json({ message: 'User already a member' });
      return;
    }

    project.members.push({ user: userId, role: role || 'Member' });
    await project.save();

    res.json(project.members);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
