import { Response } from 'express';
import Request from '../models/Request';
import Project from '../models/Project';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendLiveNotification } from '../utils/socketNotifier';

export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const requests = await Request.find({ receiverUser: req.user._id, status: 'Pending' })
      .populate('sender', 'username name profilePicture')
      .populate('receiverProject', 'name');
      
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const sendJoinRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId } = req.body;
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Ensure not already a member
    const isMember = project.members.some(m => m.user.toString() === req.user?._id.toString());
    if (isMember) {
      res.status(400).json({ message: 'Already a member of this project' });
      return;
    }

    const existingRequest = await Request.findOne({
      sender: req.user._id,
      receiverUser: project.creator,
      receiverProject: projectId,
      status: 'Pending'
    });
    if (existingRequest) {
      res.status(400).json({ message: 'Join request already sent' });
      return;
    }

    const request = await Request.create({
      sender: req.user._id,
      receiverUser: project.creator, // the Owner/creator handles it
      receiverProject: projectId,
      type: 'Join'
    });

    const notif = await Notification.create({
      user: project.creator,
      content: `${req.user.name} requested to join ${project.name}`,
      type: 'Invite',
      relatedId: request._id as any,
      projectId: project._id as any
    });
    sendLiveNotification(req, project.creator, notif);

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const sendInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, targetUserId } = req.body;
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const isMember = project.members.some(m => m.user.toString() === targetUserId);
    if (isMember) {
      res.status(400).json({ message: 'User is already a member' });
      return;
    }

    const existingRequest = await Request.findOne({
      sender: req.user._id,
      receiverUser: targetUserId,
      receiverProject: projectId,
      status: 'Pending'
    });
    if (existingRequest) {
      res.status(400).json({ message: 'Invite already sent' });
      return;
    }

    const request = await Request.create({
      sender: req.user._id,
      receiverUser: targetUserId,
      receiverProject: projectId,
      type: 'Invite'
    });

    const notif = await Notification.create({
      user: targetUserId,
      content: `${req.user.name} invited you to join ${project.name}`,
      type: 'Invite',
      relatedId: request._id as any,
      projectId: project._id as any
    });
    sendLiveNotification(req, targetUserId, notif);

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const respondToRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { requestId } = req.params;
  const { action } = req.body; // 'Accept' or 'Reject'

  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const request = await Request.findById(requestId);
    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    if (request.receiverUser?.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to respond to this request' });
      return;
    }

    if (action === 'Accept') {
      const project = await Project.findById(request.receiverProject);
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      const newUserId = request.type === 'Invite' ? request.receiverUser : request.sender;
      
      const alreadyMember = project.members.some(m => m.user.toString() === newUserId?.toString());
      if (!alreadyMember && newUserId) {
        project.members.push({ user: newUserId, role: 'Member' });
        await project.save();
      }

      request.status = 'Accepted';

      if (newUserId) {
        const notif = await Notification.create({
          user: newUserId,
          content: `Your request for ${project.name} was accepted`,
          type: 'Update',
          relatedId: project._id as any,
          projectId: project._id as any
        });
        sendLiveNotification(req, newUserId, notif);
      }
    } else {
      request.status = 'Rejected';

      const project = await Project.findById(request.receiverProject);
      const recipientId = request.type === 'Invite' ? request.receiverUser : request.sender;
      if (recipientId) {
        const notif = await Notification.create({
          user: recipientId,
          content: project ? `Your request for ${project.name} was rejected` : 'Your request was rejected',
          type: 'Update',
          relatedId: request.receiverProject,
          projectId: request.receiverProject
        });
        sendLiveNotification(req, recipientId, notif);
      }
    }

    await request.save();
    
    // Mark related request notification as read
    await Notification.updateMany(
      { relatedId: request._id as any, user: req.user._id },
      { isRead: true }
    );
    
    res.json(request);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
