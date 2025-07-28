import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import connectDB from '../../../lib/mongoose';
import Task from '../../../models/Task';

// Initialize LLM clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});


// LLM providers array for random selection
const LLM_PROVIDERS = ['openai', 'anthropic'] as const;
type LLMProvider = typeof LLM_PROVIDERS[number];

// Helper function to randomly select an available LLM provider
function selectRandomLLM(availableProviders: LLMProvider[]): LLMProvider {
  const randomIndex = Math.floor(Math.random() * availableProviders.length);
  return availableProviders[randomIndex];
}

// Helper function to convert messages to text prompt
function messagesToPrompt(message: string, task: any): string {
  return `Task: ${task.name}\n\nUser Message: ${message}\n\nPlease provide a helpful response based on the task context.`;
}

// LLM API functions
async function callOpenAI(prompt: string, helperSystemPrompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: helperSystemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Unable to generate response from OpenAI');
  }
}

async function callAnthropic(prompt: string, helperSystemPrompt: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: helperSystemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    return response.content[0]?.type === 'text' ? response.content[0].text : 'No response generated';
  } catch (error) {
    console.error('Anthropic API error:', error);
    throw new Error('Unable to generate response from Claude');
  }
}


export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { taskId, message } = body;

    console.log('Chat API - Received request:', { taskId, message: message?.substring(0, 100) });
    
    if (!taskId || !message) {
      return NextResponse.json(
        { error: 'taskId and message are required' },
        { status: 400 }
      );
    }
    
    // Verify task exists and get helper system prompt
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check available API keys
    const hasOpenAI = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';
    // Build list of available providers
    const availableProviders: LLMProvider[] = [];
    if (hasOpenAI) availableProviders.push('openai');
    if (hasAnthropic) availableProviders.push('anthropic');

    console.log('Chat API - Available providers:', availableProviders);

    if (availableProviders.length === 0) {
      return NextResponse.json(
        { 
          response: 'I apologize, but the chat service is currently unavailable. Please try again later.',
          provider: 'fallback'
        },
        { status: 200 }
      );
    }

    // Randomly select a provider
    const selectedProvider = selectRandomLLM(availableProviders);
    console.log('Chat API - Selected provider:', selectedProvider);

    // Generate prompt
    const prompt = messagesToPrompt(message, task);
    const helperSystemPrompt = task.helperSystemPrompt;

    let response: string;
    let providerName: string;

    try {
      switch (selectedProvider) {
        case 'openai':
          response = await callOpenAI(prompt, helperSystemPrompt);
          providerName = 'OpenAI GPT-4';
          break;
        case 'anthropic':
          response = await callAnthropic(prompt, helperSystemPrompt);
          providerName = 'Anthropic Claude';
          break;
        default:
          throw new Error('Invalid provider selected');
      }

      console.log('Chat API - Generated response from:', providerName);

      return NextResponse.json({
        response,
        provider: providerName
      });

    } catch (error) {
      console.error(`Error calling ${selectedProvider}:`, error);
      
      // Try to fallback to another provider if available
      const remainingProviders = availableProviders.filter(p => p !== selectedProvider);
      if (remainingProviders.length > 0) {
        const fallbackProvider = selectRandomLLM(remainingProviders);
        console.log('Chat API - Falling back to:', fallbackProvider);
        
        try {
          switch (fallbackProvider) {
            case 'openai':
              response = await callOpenAI(prompt, helperSystemPrompt);
              providerName = 'OpenAI GPT-4';
              break;
            case 'anthropic':
              response = await callAnthropic(prompt, helperSystemPrompt);
              providerName = 'Anthropic Claude';
              break;
          }

          return NextResponse.json({
            response,
            provider: providerName
          });
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
        }
      }

      // If all providers fail, return a generic error message
      return NextResponse.json({
        response: 'I apologize, but I encountered an error while processing your message. Please try again.',
        provider: 'error'
      });
    }

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}