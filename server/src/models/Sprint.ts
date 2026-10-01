import mongoose, { Document, Schema } from 'mongoose';

export interface ISprint extends Document {
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'future' | 'completed';
}

const SprintSchema = new Schema<ISprint>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    goal: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'future', 'completed'],
      default: 'active',
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

export const Sprint = mongoose.model<ISprint>('Sprint', SprintSchema);
