import { Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import Project from '../models/Project';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendLiveNotification } from '../utils/socketNotifier';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'username name profilePicture')
      .populate('comments.user', 'username name profilePicture')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, labels, dueDate, assignee } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await Task.create({
      project: new mongoose.Types.ObjectId(projectId as string),
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      labels: labels || [],
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignee: assignee ? new mongoose.Types.ObjectId(assignee) : undefined,
      activityHistory: [{
        action: `Task created by ${req.user.name}`,
        user: req.user._id
      }]
    });

    // Notify assignee if assigned
    if (assignee && assignee.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        user: assignee,
        content: `You have been assigned a new task: "${title}"`,
        type: 'TaskAssigned',
        projectId: projectId as any
      });
      sendLiveNotification(req, assignee, notif);
    }

    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, labels, dueDate, assignee } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Build log messages for changes
    const changes: string[] = [];
    if (title && title !== task.title) {
      changes.push(`renamed task to "${title}"`);
      task.title = title;
    }
    if (description !== undefined && description !== task.description) {
      task.description = description;
    }
    if (status && status !== task.status) {
      changes.push(`moved status to "${status}"`);
      task.status = status;

      // Notify owner/members on completion
      if (status === 'Completed') {
        const project = await Project.findById(task.project);
        if (project) {
          const notif = await Notification.create({
            user: project.creator,
            content: `Task "${task.title}" has been completed by ${req.user.name}`,
            type: 'TaskCompleted',
            projectId: project._id as any
          });
          sendLiveNotification(req, project.creator, notif);
        }
      }
    }
    if (priority && priority !== task.priority) {
      changes.push(`set priority to "${priority}"`);
      task.priority = priority;
    }
    if (labels !== undefined) {
      task.labels = labels;
    }
    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }
    if (assignee !== undefined && assignee !== (task.assignee?.toString() || '')) {
      if (assignee) {
        changes.push(`assigned task to user`);
        task.assignee = new mongoose.Types.ObjectId(assignee) as any;

        // Notify new assignee
        if (assignee.toString() !== req.user._id.toString()) {
          const notif = await Notification.create({
            user: assignee,
            content: `You have been assigned the task: "${task.title}"`,
            type: 'TaskAssigned',
            projectId: task.project as any
          });
          sendLiveNotification(req, assignee, notif);
        }
      } else {
        changes.push(`unassigned task`);
        task.assignee = undefined;
      }
    }

    if (changes.length > 0) {
      task.activityHistory.push({
        action: `Task updated: ${changes.join(', ')} (by ${req.user.name})`,
        user: req.user._id as any
      });
    }

    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'username name profilePicture')
      .populate('comments.user', 'username name profilePicture');

    res.json(populatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addTaskComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    task.comments.push({
      user: req.user._id as any,
      content,
      createdAt: new Date()
    });

    task.activityHistory.push({
      action: `${req.user.name} added a comment`,
      user: req.user._id as any
    });

    await task.save();

    // Populate comments
    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'username name profilePicture')
      .populate('comments.user', 'username name profilePicture');

    // Notify assignee if not the commenter
    if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        user: task.assignee,
        content: `${req.user.name} commented on your task: "${task.title}"`,
        type: 'CommentAdded',
        projectId: task.project as any
      });
      sendLiveNotification(req, task.assignee, notif);
    }

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const toggleTaskChecklist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const { isCompleted } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const item = (task.checklist as any).id(itemId);
    if (!item) {
      res.status(404).json({ message: 'Checklist item not found' });
      return;
    }

    item.isCompleted = isCompleted;
    task.activityHistory.push({
      action: `${req.user.name} marked checklist item "${item.text}" as ${isCompleted ? 'completed' : 'incomplete'}`,
      user: req.user._id as any
    });

    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'username name profilePicture')
      .populate('comments.user', 'username name profilePicture');

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addTaskChecklistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    task.checklist.push({ text, isCompleted: false });
    task.activityHistory.push({
      action: `${req.user.name} added checklist item "${text}"`,
      user: req.user._id as any
    });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'username name profilePicture')
      .populate('comments.user', 'username name profilePicture');

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTaskChecklistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params;

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const item = (task.checklist as any).id(itemId);
    if (item) {
      task.activityHistory.push({
        action: `${req.user.name} removed checklist item "${item.text}"`,
        user: req.user._id as any
      });
      task.checklist = task.checklist.filter((i) => i._id?.toString() !== itemId);
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'username name profilePicture')
      .populate('comments.user', 'username name profilePicture');

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
