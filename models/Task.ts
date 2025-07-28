import mongoose, { Schema, Document } from 'mongoose';

export interface ICredential {
  id: string;
  name: string;
  logo: string;
  reclaimProviderId: string;
}

export interface ITask extends Document {
  name: string;
  description: string;
  logo: string;
  systemPrompt: string;
  helperSystemPrompt: string;
  requiredCredentials: ICredential[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialSchema = new Schema<ICredential>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  logo: { type: String, required: true },
  reclaimProviderId: { type: String, required: true }
});

const TaskSchema = new Schema<ITask>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  logo: { type: String, required: true },
  systemPrompt: { type: String, required: true, trim: true },
  helperSystemPrompt: { type: String, required: true, trim: true },
  requiredCredentials: [CredentialSchema],
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);