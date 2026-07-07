import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import connectDB from './config/db';
import User, { IUser } from './models/User';
import Project from './models/Project';
import Message from './models/Message';
import Notification from './models/Notification';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import requestRoutes from './routes/requestRoutes';
import messageRoutes from './routes/messageRoutes';
import uploadRoutes from './routes/uploadRoutes';
import notificationRoutes from './routes/notificationRoutes';
import taskRoutes from './routes/taskRoutes';
import { notFound, errorHandler } from './middleware/errorMiddleware';

// Custom interface for Socket.io authenticated sockets
interface AuthenticatedSocket extends Socket {
  user?: IUser;
}

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Required to allow serving local uploaded files to the frontend
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies
}));

app.use(express.json());
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/workspace', workspaceRoutes);
app.use('/api/projects/:projectId/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('ICON API is running...');
});

app.use(notFound);
app.use(errorHandler);

const userCanAccessProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) return null;

  const isCreator = project.creator.toString() === userId.toString();
  const isMember = project.members.some((member) => member.user.toString() === userId.toString());
  return isCreator || isMember ? project : null;
};

// Socket.io Handshake JWT Authentication
io.use(async (socket: AuthenticatedSocket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return next(new Error('JWT Secret is not configured'));

    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

const onlineUsers = new Map<string, string>();

app.set('socketio', io);
app.set('onlineUsers', onlineUsers);

// Socket.io handlers
io.on('connection', (socket: AuthenticatedSocket) => {
  console.log('A user connected:', socket.id, 'User ID:', socket.user?._id);

  if (socket.user) {
    onlineUsers.set(socket.user._id.toString(), socket.id);
    io.emit('user_online', { userId: socket.user._id.toString() });
  }

  socket.on('join_project', async (projectId: string) => {
    try {
      if (!socket.user) return;
      const project = await userCanAccessProject(projectId, socket.user._id.toString());
      if (!project) {
        socket.emit('chat_error', { message: 'Not authorized for this project chat' });
        return;
      }

      socket.join(projectId);
      console.log(`User ${socket.user.name} joined project room: ${projectId}`);
    } catch (error) {
      socket.emit('chat_error', { message: 'Could not join project room' });
    }
  });

  socket.on('typing', (data: { projectId: string; isTyping: boolean }) => {
    if (!socket.user) return;
    socket.to(data.projectId).emit('user_typing', {
      userId: socket.user._id.toString(),
      name: socket.user.name,
      isTyping: data.isTyping
    });
  });

  socket.on('board_update', (data: { projectId: string }) => {
    socket.to(data.projectId).emit('board_updated');
  });

  socket.on('send_message', async (data: { projectId: string; content: string }) => {
    try {
      if (!socket.user) return;
      const content = data.content?.trim();
      if (!content) return;

      const project = await userCanAccessProject(data.projectId, socket.user._id.toString());
      if (!project) {
        socket.emit('chat_error', { message: 'Not authorized for this project chat' });
        return;
      }

      const message = await Message.create({
        chatId: data.projectId,
        chatModel: 'Project',
        sender: socket.user._id,
        content,
        deliveredTo: [socket.user._id],
        readBy: [socket.user._id]
      });

      const populatedMessage = await message.populate('sender', 'username name profilePicture');
      io.to(data.projectId).emit('receive_message', populatedMessage);

      const recipientIds = project.members
        .map((member) => member.user.toString())
        .filter((userId) => userId !== socket.user?._id?.toString());

      if (recipientIds.length > 0) {
        const notifications = await Notification.insertMany(
          recipientIds.map((userId) => ({
            user: userId,
            content: `${socket.user?.name} sent a message in ${project.name}`,
            type: 'Message',
            relatedId: message._id as any,
            projectId: project._id as any,
          })),
          { ordered: false }
        );

        // Emit real-time notification to online recipients
        notifications.forEach((notif) => {
          const recSocket = onlineUsers.get(notif.user.toString());
          if (recSocket) {
            io.to(recSocket).emit('notification_received', notif);
          }
        });
      }
    } catch (error) {
      socket.emit('chat_error', { message: 'Message could not be sent' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.user) {
      onlineUsers.delete(socket.user._id.toString());
      io.emit('user_offline', { userId: socket.user._id.toString() });
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
