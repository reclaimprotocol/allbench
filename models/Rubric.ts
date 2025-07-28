import mongoose, { Schema, Document } from 'mongoose';

export interface IRubric extends Document {
  name: string;
  description: string;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
}

const RubricSchema = new Schema<IRubric>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  taskId: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.models.Rubric || mongoose.model<IRubric>('Rubric', RubricSchema);