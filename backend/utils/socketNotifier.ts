import { Request } from 'express';

export const sendLiveNotification = (req: Request, userId: any, notification: any): void => {
  try {
    const io = req.app.get('socketio');
    const onlineUsers = req.app.get('onlineUsers');
    if (io && onlineUsers) {
      const socketId = onlineUsers.get(userId.toString());
      if (socketId) {
        io.to(socketId).emit('notification_received', notification);
        console.log(`Live notification emitted to user: ${userId} via socket: ${socketId}`);
      }
    }
  } catch (error) {
    console.error('Error sending live socket notification', error);
  }
};
