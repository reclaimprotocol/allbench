import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: 'individual' | 'broadcast';
  targetUser?: string; // username for individual notifications
  createdAt: Date;
  isActive: boolean;
  readBy: Array<{
    username: string;
    readAt: Date;
  }>;
}

const NotificationSchema = new Schema<INotification>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['individual', 'broadcast']
  },
  targetUser: {
    type: String,
    required: function() {
      return this.type === 'individual';
    },
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  readBy: [{
    username: {
      type: String,
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Index for efficient queries
NotificationSchema.index({ type: 1, targetUser: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ 'readBy.username': 1 });

export default model<INotification>('Notification', NotificationSchema);