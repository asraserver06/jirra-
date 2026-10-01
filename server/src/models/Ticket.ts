import mongoose, { Document, Schema, Types } from 'mongoose';

export type TicketStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TicketType = 'bug' | 'story' | 'task' | 'epic';

export interface IComment {
  id?: string;
  user: Types.ObjectId | any;
  text: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  key: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  storyPoints: number;
  assignee: Types.ObjectId | any;
  reporter: Types.ObjectId | any;
  comments: IComment[];
  fontFamily?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        return ret;
      },
    },
  }
);

const TicketSchema = new Schema<ITicket>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    type: {
      type: String,
      enum: ['bug', 'story', 'task', 'epic'],
      default: 'story',
    },
    storyPoints: {
      type: Number,
      default: 3,
      min: 0,
      max: 100,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: [CommentSchema],
    fontFamily: {
      type: String,
      default: 'Inter, sans-serif',
    },
    alignment: {
      type: String,
      enum: ['left', 'center', 'right', 'justify'],
      default: 'left',
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

// Compound Index for high-performance board queries & sorting
TicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
