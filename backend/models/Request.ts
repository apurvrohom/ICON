import mongoose, { Schema, Document } from 'mongoose';

export interface IRequest extends Document {
  sender: mongoose.Types.ObjectId;
  receiverUser?: mongoose.Types.ObjectId;
  receiverProject?: mongoose.Types.ObjectId;
  type: 'Invite' | 'Join' | 'Collab';
  status: 'Pending' | 'Accepted' | 'Rejected';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  receiverProject: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  type: {
    type: String,
    enum: ['Invite', 'Join', 'Collab'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  message: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model<IRequest>('Request', RequestSchema);
