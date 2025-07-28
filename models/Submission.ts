import mongoose, { Schema, Document } from 'mongoose';

export interface ILLMResponse {
  llmName: string;
  response: string;
}

export interface IEvaluation {
  llmName: string;
  score: number;
  description: string;
}

export interface IRubricEvaluation {
  rubricId: string;
  evaluations: IEvaluation[];
}

export interface IMessage {
  id: string;
  type: 'system' | 'user' | 'assistant';
  content: string;
  contentType: 'text' | 'image' | 'pdf';
  uri?: string;
  fileName?: string;
  fileData?: string;
  mimeType?: string;
  provider?: string;
}

export interface ISubmission extends Document {
  taskId: string;
  llmResponses: ILLMResponse[];
  rubrics: IRubricEvaluation[];
  messages: IMessage[];
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const LLMResponseSchema = new Schema<ILLMResponse>({
  llmName: { type: String, required: true },
  response: { type: String, required: true }
});

const EvaluationSchema = new Schema<IEvaluation>({
  llmName: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 10 },
  description: { type: String, required: true }
});

const RubricEvaluationSchema = new Schema<IRubricEvaluation>({
  rubricId: { type: String, required: true },
  evaluations: [EvaluationSchema]
});

const MessageSchema = new Schema<IMessage>({
  id: { type: String, required: true },
  type: { type: String, required: true, enum: ['system', 'user', 'assistant'] },
  content: { type: String, required: true },
  contentType: { type: String, required: true, enum: ['text', 'image', 'pdf'] },
  uri: { type: String, required: false },
  fileName: { type: String, required: false },
  fileData: { type: String, required: false },
  mimeType: { type: String, required: false },
  provider: { type: String, required: false }
});

const SubmissionSchema = new Schema<ISubmission>({
  taskId: { type: String, required: true },
  llmResponses: [LLMResponseSchema],
  rubrics: [RubricEvaluationSchema],
  messages: [MessageSchema],
  walletAddress: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);