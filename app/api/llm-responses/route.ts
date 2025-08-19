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


// Helper function to convert messages to text prompt
function messagesToPrompt(messages: any[], task: any): string {
  let prompt = ``;
  
  // Ensure messages is an array
  if (!Array.isArray(messages)) {
    console.error('messagesToPrompt: messages is not an array:', typeof messages, messages);
    messages = [];
  }
  
  messages.forEach((message: any, index: number) => {
    if (message.contentType === 'text') {
      prompt += `${index + 1}. ${message.content}\n`;
    } else if (message.contentType === 'image') {
      prompt += `${index + 1}. [Image: ${message.fileName || 'Image attachment'}]\n`;
    } else if (message.contentType === 'pdf') {
      prompt += `${index + 1}. [PDF Document: ${message.fileName || 'Document attachment'}]\n`;
    }
  });
  
  prompt += '\nPlease analyze the provided information and provide a comprehensive response based on the task requirements.';
  return prompt;
}

// LLM API functions
async function callOpenAI(prompt: string, messages: any[], systemPrompt: string): Promise<string> {
  try {
    const openaiMessages: any[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Add image messages if present
    for (const message of messages) {
      if (message.contentType === 'image' && message.fileData) {
        openaiMessages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `This is an image attachment: ${message.content}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${message.mimeType};base64,${message.fileData}`
              }
            }
          ]
        });
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-5-2025-08-07',
      messages: openaiMessages,
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Error: Unable to generate response from OpenAI';
  }
}

async function callAnthropic(prompt: string, messages: any[], systemPrompt: string): Promise<string> {
  try {
    const content: any[] = [{ type: 'text', text: prompt }];

    // Add image content if present
    for (const message of messages) {
      if (message.contentType === 'image' && message.fileData) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: message.mimeType,
            data: message.fileData
          }
        });
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
    });

    return response.content[0]?.type === 'text' ? response.content[0].text : 'No response generated';
  } catch (error) {
    console.error('Anthropic API error:', error);
    return 'Error: Unable to generate response from Claude';
  }
}


// Sample LLM responses as fallback
const sampleLLMResponses = [
  {
    llmName: 'OpenAI GPT-5',
    response: '# Could not find any relevant information in the provided context.'
  },
  {
    llmName: 'Anthropic Claude',
    response: '# Could not find any relevant information in the provided context.'
  },
];

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { taskId, messages } = body;

    console.log('LLM API - Received request:', { taskId, messageCount: messages?.length });
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }
    
    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if we have valid API keys
    const hasOpenAI = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';
    console.log('LLM API - Available APIs:', { hasOpenAI, hasAnthropic });

    if (!hasOpenAI && !hasAnthropic) {
      console.log('LLM API - No valid API keys, returning sample responses');
      return NextResponse.json(sampleLLMResponses);
    }

    // Generate prompt from messages and task
    const safeMessages = Array.isArray(messages) ? messages : [];
    const prompt = messagesToPrompt(safeMessages, task);
    console.log('LLM API - Generated prompt:', prompt.substring(0, 200) + '...');
    console.log('LLM API - Using system prompt:', task.systemPrompt);

    // Call all available LLM APIs in parallel
    const responses = await Promise.allSettled([
      hasOpenAI ? callOpenAI(prompt, messages || [], task.systemPrompt) : Promise.resolve('OpenAI API not configured'),
      hasAnthropic ? callAnthropic(prompt, messages || [], task.systemPrompt) : Promise.resolve('Anthropic API not configured'),
    ]);

    const llmResponses = [
      {
        llmName: 'OpenAI GPT-5',
        response: responses[0].status === 'fulfilled' ? responses[0].value : `Error: ${responses[0].reason}`
      },
      {
        llmName: 'Anthropic Claude',
        response: responses[1].status === 'fulfilled' ? responses[1].value : `Error: ${responses[1].reason}`
      }
    ];

    console.log('LLM API - Generated responses:', llmResponses.map(r => ({ 
      name: r.llmName, 
      responseLength: r.response.length 
    })));

    return NextResponse.json(llmResponses);
  } catch (error) {
    console.error('Error fetching LLM responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LLM responses' },
      { status: 500 }
    );
  }
}