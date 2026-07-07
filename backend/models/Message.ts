import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  chatModel: 'Project' | 'User';
  sender: mongoose.Types.ObjectId;
  content: string;
  deliveredTo: mongoose.Types.ObjectId[];
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'chatModel'
  },
  chatModel: {
    type: String,
    required: true,
    enum: ['Project', 'User']
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  deliveredTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

MessageSchema.index({ chatId: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
