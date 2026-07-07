import mongoose, { Schema, Document } from 'mongoose';

export interface INote {
  _id?: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

export interface IResource {
  _id?: mongoose.Types.ObjectId;
  name: string;
  url: string;
  type: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IWorkspace extends Document {
  project: mongoose.Types.ObjectId;
  notes: INote[];
  resources: IResource[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  notes: [{
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      default: ''
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resources: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

export default mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
