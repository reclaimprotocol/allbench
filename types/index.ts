export interface Task {
  id: string;
  name: string;
  description: string;
  logo: string;
  systemPrompt: string;
  helperSystemPrompt: string;
  requiredCredentials: Credential[];
  active: boolean;
}

export interface Credential {
  id: string;
  name: string;
  logo: string;
  reclaimProviderId: string;
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
  taskId: string;
}

export interface LLMResponse {
  llmName: string;
  response: string;
}

export interface Submission {
  taskId: string;
  llmResponses: LLMResponse[];
  rubrics: {
    rubricId: string;
    evaluations: {
      llmName: string;
      score: number;
      description: string;
      candidateLlmName?: string;
    }[];
  }[];
  walletAddress: string;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  score: number;
  submissions: number;
}