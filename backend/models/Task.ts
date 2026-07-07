import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskComment {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  createdAt?: Date;
}

export interface ITaskChecklistItem {
  _id?: mongoose.Types.ObjectId;
  text: string;
  isCompleted: boolean;
}

export interface ITaskActivity {
  _id?: mongoose.Types.ObjectId;
  action: string;
  user: mongoose.Types.ObjectId;
  createdAt?: Date;
}

export interface ITaskAttachment {
  _id?: mongoose.Types.ObjectId;
  name: string;
  url: string;
  uploadedAt?: Date;
}

export interface ITask extends Document {
  project: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  labels: string[];
  dueDate?: Date;
  assignee?: mongoose.Types.ObjectId;
  attachments: ITaskAttachment[];
  comments: ITaskComment[];
  checklist: ITaskChecklistItem[];
  activityHistory: ITaskActivity[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Review', 'Completed'],
    default: 'Todo'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  labels: [{
    type: String
  }],
  dueDate: {
    type: Date
  },
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  checklist: [{
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }],
  activityHistory: [{
    action: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

TaskSchema.index({ project: 1 });
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ status: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
