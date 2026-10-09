import mongoose, { Document, Schema, Types } from 'mongoose';

export type WorkspaceRole = 'admin' | 'member';

export interface IMembership extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  role: WorkspaceRole;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
      required: true,
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

// A user can only have one membership per workspace
MembershipSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const Membership = mongoose.model<IMembership>('Membership', MembershipSchema);
