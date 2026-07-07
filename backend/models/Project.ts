import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectMember {
  user: mongoose.Types.ObjectId;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
}

export interface IProject extends Document {
  name: string;
  description: string;
  motto?: string;
  domain?: string;
  tags: string[];
  isPublic: boolean;
  creator: mongoose.Types.ObjectId;
  members: IProjectMember[];
  workspace?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  motto: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Member', 'Viewer'],
      default: 'Member'
    }
  }],
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace'
  }
}, { timestamps: true });

ProjectSchema.index({ creator: 1 });
ProjectSchema.index({ 'members.user': 1 });
ProjectSchema.index({ isPublic: 1 });
ProjectSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IProject>('Project', ProjectSchema);
