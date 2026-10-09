import mongoose, { Document, Schema, Types } from 'mongoose';
import { WorkspaceRole } from './Membership.js';

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface IInvitation extends Document {
  workspace: Types.ObjectId;
  email: string;
  role: WorkspaceRole;
  invitedBy: Types.ObjectId;
  tokenHash: string;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
      index: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
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
        delete ret.tokenHash; // Never expose tokenHash in JSON
        return ret;
      },
    },
  }
);

// We allow multiple invites to the same email over time (e.g. if one expired/revoked),
// but we might want to ensure only one *pending* invite exists per email-workspace pair.
// This is typically handled in the controller logic, but we can also add a partial index.
InvitationSchema.index(
  { workspace: 1, email: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: 'pending' } 
  }
);

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
