import { NextRequest, NextResponse } from 'next/server';
import llmEvaluationService from '../../../services/llmEvaluationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service } = body;
    
    const testRubricName = "Test Clarity";
    const testRubricDescription = "Evaluate how clear and understandable the response is";
    const testCandidateResponse = "This is a test response to evaluate clarity and understanding.";
    
    console.log(`Testing ${service} service...`);
    
    let result;
    
    if (service === 'openai') {
      result = await llmEvaluationService.evaluateWithOpenAI(
        testRubricName,
        testRubricDescription,
        testCandidateResponse
      );
    } else if (service === 'claude') {
      result = await llmEvaluationService.evaluateWithClaude(
        testRubricName,
        testRubricDescription,
        testCandidateResponse
      );
    } else if (service === 'both') {
      result = await llmEvaluationService.evaluateRubric(
        testRubricName,
        testRubricDescription,
        testCandidateResponse
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid service. Use "openai", "claude", or "both"' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      service,
      result
    });
  } catch (error) {
    console.error(`Error testing LLM service:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      },
      { status: 500 }
    );
  }
}