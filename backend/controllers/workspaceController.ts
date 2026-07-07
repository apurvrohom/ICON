import { Response } from 'express';
import Workspace from '../models/Workspace';
import { AuthRequest } from '../middleware/authMiddleware';

export const getWorkspaceByProjectId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspace = await Workspace.findOne({ project: req.params.projectId })
      .populate('notes.createdBy', 'username name')
      .populate('resources.uploadedBy', 'username name');

    if (!workspace) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }
    
    res.json(workspace);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, content } = req.body;
  try {
    const workspace = await Workspace.findOne({ project: req.params.projectId });
    if (!workspace) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    workspace.notes.push({
      title,
      content,
      createdBy: req.user._id as any,
      updatedAt: new Date()
    });

    await workspace.save();
    res.json(workspace.notes);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { noteId, title, content } = req.body;
  try {
    const workspace = await Workspace.findOne({ project: req.params.projectId });
    if (!workspace) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }

    const note = (workspace.notes as any).id(noteId);
    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    note.title = title || note.title;
    note.content = content || note.content;
    note.updatedAt = new Date();

    await workspace.save();
    res.json(workspace.notes);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addResource = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, url, type } = req.body;
  try {
    const workspace = await Workspace.findOne({ project: req.params.projectId });
    if (!workspace) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    workspace.resources.push({
      name,
      url,
      type,
      uploadedBy: req.user._id as any,
      createdAt: new Date()
    });

    await workspace.save();
    res.json(workspace.resources);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
