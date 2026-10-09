import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  slug?: string;
  goal?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    goal: {
      type: String,
      trim: true,
      maxlength: 250,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
