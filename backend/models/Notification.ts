import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 
  | 'Message'
  | 'Invite'
  | 'TaskAssigned'
  | 'TaskCompleted'
  | 'CommentAdded'
  | 'FileUploaded'
  | 'Mention'
  | 'Deadline'
  | 'Collab'
  | 'Update'
  | 'System';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  content: string;
  type: NotificationType;
  relatedId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'Message',
      'Invite',
      'TaskAssigned',
      'TaskCompleted',
      'CommentAdded',
      'FileUploaded',
      'Mention',
      'Deadline',
      'Collab',
      'Update',
      'System'
    ],
    default: 'System'
  },
  relatedId: {
    type: Schema.Types.ObjectId
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
