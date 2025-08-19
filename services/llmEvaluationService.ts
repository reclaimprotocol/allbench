import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface LLMEvaluationResult {
  llmName: string;
  score: number;
  description: string;
}

export interface ScoreVariance {
  status: 'green' | 'yellow' | 'red';
  scores: number[];
  variance: number;
}

class LLMEvaluationService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async evaluateWithOpenAI(
    rubricName: string,
    rubricDescription: string,
    candidateResponse: string
  ): Promise<LLMEvaluationResult> {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }
    const prompt = `
You are an expert evaluator. Please evaluate the following candidate response based on the given rubric.

Rubric: ${rubricName}
Description: ${rubricDescription}

Candidate Response:
${candidateResponse}

Please provide:
1. A score from 0-10 (where 0 is completely failing the rubric and 10 is perfectly meeting it)
2. A brief explanation (2-3 sentences) of why you gave this score

Format your response as JSON:
{
  "score": <number>,
  "description": "<explanation>"
}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-5-2025-08-07",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('OpenAI raw response:', content);
      
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (jsonError) {
        console.error('Failed to parse OpenAI JSON response:', content);
        // Try to extract score and description from malformed response
        const scoreMatch = content.match(/"score"\s*:\s*(\d+)/);
        const descMatch = content.match(/"description"\s*:\s*"([^"]+)"/);
        
        if (scoreMatch && descMatch) {
          parsed = {
            score: parseInt(scoreMatch[1]),
            description: descMatch[1]
          };
        } else {
          const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error';
          throw new Error(`Invalid JSON response from OpenAI: ${errorMessage}`);
        }
      }
      return {
        llmName: 'gpt-5-2025-08-07',
        score: Math.max(0, Math.min(10, parsed.score)),
        description: parsed.description
      };
    } catch (error) {
      console.error('OpenAI evaluation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
      
      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack,
        rubricName,
        candidateResponseLength: candidateResponse?.length || 0
      });
      throw new Error(`Failed to evaluate with OpenAI: ${errorMessage}`);
    }
  }

  async evaluateWithClaude(
    rubricName: string,
    rubricDescription: string,
    candidateResponse: string
  ): Promise<LLMEvaluationResult> {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Anthropic API key not configured');
      throw new Error('Anthropic API key not configured');
    }
    const prompt = `
You are an expert evaluator. Please evaluate the following candidate response based on the given rubric.

Rubric: ${rubricName}
Description: ${rubricDescription}

Candidate Response:
${candidateResponse}

Please provide:
1. A score from 0-10 (where 0 is completely failing the rubric and 10 is perfectly meeting it)
2. A brief explanation (2-3 sentences) of why you gave this score

Format your response as JSON:
{
  "score": <number>,
  "description": "<explanation>"
}
`;

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-opus-4-20250514",
        max_tokens: 300,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const rawText = content.text.trim();
      console.log('Claude raw response:', rawText);
      
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (jsonError) {
        console.error('Failed to parse Claude JSON response:', rawText);
        // Try to extract score and description from malformed response
        const scoreMatch = rawText.match(/"score"\s*:\s*(\d+)/);
        const descMatch = rawText.match(/"description"\s*:\s*"([^"]+)"/);
        
        if (scoreMatch && descMatch) {
          parsed = {
            score: parseInt(scoreMatch[1]),
            description: descMatch[1]
          };
        } else {
          const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error';
          throw new Error(`Invalid JSON response from Claude: ${errorMessage}`);
        }
      }
      return {
        llmName: 'Claude 3.5 Sonnet',
        score: Math.max(0, Math.min(10, parsed.score)),
        description: parsed.description
      };
    } catch (error) {
      console.error('Claude evaluation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
      
      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack,
        rubricName,
        candidateResponseLength: candidateResponse?.length || 0
      });
      throw new Error(`Failed to evaluate with Claude: ${errorMessage}`);
    }
  }

  async evaluateRubric(
    rubricName: string,
    rubricDescription: string,
    candidateResponse: string
  ): Promise<LLMEvaluationResult[]> {
    try {
      console.log('Starting rubric evaluation:', {
        rubricName,
        candidateResponseLength: candidateResponse?.length || 0
      });

      const evaluations: LLMEvaluationResult[] = [];
      
      // Try OpenAI evaluation
      try {
        const openaiResult = await this.evaluateWithOpenAI(rubricName, rubricDescription, candidateResponse);
        evaluations.push(openaiResult);
        console.log('OpenAI evaluation successful');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('OpenAI evaluation failed:', errorMessage);
        // Add a fallback evaluation
        evaluations.push({
          llmName: 'OpenAI GPT-4o (Fallback)',
          score: 5, // Neutral score
          description: 'OpenAI evaluation failed. This is a fallback score.'
        });
      }

      // Try Claude evaluation
      try {
        const claudeResult = await this.evaluateWithClaude(rubricName, rubricDescription, candidateResponse);
        evaluations.push(claudeResult);
        console.log('Claude evaluation successful');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Claude evaluation failed:', errorMessage);
        // Add a fallback evaluation
        evaluations.push({
          llmName: 'Claude 3.5 Sonnet (Fallback)',
          score: 5, // Neutral score
          description: 'Claude evaluation failed. This is a fallback score.'
        });
      }

      if (evaluations.length === 0) {
        throw new Error('All LLM evaluations failed');
      }

      console.log('Completed rubric evaluation:', {
        rubricName,
        evaluationCount: evaluations.length,
        scores: evaluations.map(e => e.score)
      });

      return evaluations;
    } catch (error) {
      console.error('Error in evaluateRubric:', error);
      throw error;
    }
  }

  calculateScoreVariance(scores: number[]): ScoreVariance {
    if (scores.length < 2) {
      return { status: 'green', scores, variance: 0 };
    }

    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const variance = ((max - min) / 10) * 100; // Convert to percentage

    let status: 'green' | 'yellow' | 'red';
    if (variance <= 10) {
      status = 'green';
    } else if (variance <= 30) {
      status = 'yellow';
    } else {
      status = 'red';
    }

    return { status, scores, variance };
  }

  areAllRubricsGreen(evaluations: { rubricId: string; scoreVariance: ScoreVariance }[]): boolean {
    return evaluations.every(evaluation => evaluation.scoreVariance.status === 'green');
  }
}

export default new LLMEvaluationService();