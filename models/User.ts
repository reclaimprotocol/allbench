import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  walletAddress: string;
  points: number;
  fcmToken?: string;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]{3,20}$/
  },
  walletAddress: { 
    type: String, 
    required: true, 
    unique: true 
  },
  points: { 
    type: Number, 
    default: 0 
  },
  fcmToken: {
    type: String,
    required: false
  },
  notificationsEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);