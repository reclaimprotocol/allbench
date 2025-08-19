import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import Rubric from '../../../models/Rubric';
import llmEvaluationService, { LLMEvaluationResult, ScoreVariance } from '../../../services/llmEvaluationService';

interface EvaluateRubricsRequest {
  rubricIds: string[];
  candidateResponse: string;
}

interface RubricEvaluationResponse {
  rubricId: string;
  rubricName: string;
  evaluations: LLMEvaluationResult[];
  scoreVariance: ScoreVariance;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body: EvaluateRubricsRequest = await request.json();
    const { rubricIds, candidateResponse } = body;
    
    if (!rubricIds || !Array.isArray(rubricIds) || rubricIds.length === 0) {
      return NextResponse.json(
        { error: 'rubricIds array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!candidateResponse || candidateResponse.trim().length === 0) {
      return NextResponse.json(
        { error: 'candidateResponse is required and cannot be empty' },
        { status: 400 }
      );
    }
    
    // Fetch all rubrics
    console.log('Fetching rubrics with IDs:', rubricIds);
    
    // Convert string IDs to ObjectId if needed
    const mongoose = require('mongoose');
    const objectIds = rubricIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (error) {
        console.error(`Invalid ObjectId format: ${id}`);
        throw new Error(`Invalid rubric ID format: ${id}`);
      }
    });
    
    const rubrics = await Rubric.find({ 
      _id: { $in: objectIds } 
    });
    
    console.log('Found rubrics:', {
      requested: rubricIds.length,
      found: rubrics.length,
      rubricNames: rubrics.map(r => r.name)
    });
    
    if (rubrics.length !== rubricIds.length) {
      console.error('Rubric count mismatch:', {
        requestedIds: rubricIds,
        foundRubrics: rubrics.map(r => ({ id: r._id.toString(), name: r.name }))
      });
      
      // Let's also check if any rubrics exist at all
      const allRubrics = await Rubric.find({}).limit(5);
      console.log('Sample of all rubrics in database:', 
        allRubrics.map(r => ({ id: r._id.toString(), name: r.name }))
      );
      
      return NextResponse.json(
        { 
          error: 'One or more rubrics not found',
          details: {
            requested: rubricIds.length,
            found: rubrics.length,
            requestedIds: rubricIds,
            foundIds: rubrics.map(r => r._id.toString()),
            sampleRubricsInDb: allRubrics.map(r => ({ id: r._id.toString(), name: r.name }))
          }
        },
        { status: 404 }
      );
    }
    
    console.log('Starting evaluation for rubrics:', {
      rubricCount: rubrics.length,
      rubricNames: rubrics.map(r => r.name),
      candidateResponseLength: candidateResponse.length
    });

    // Evaluate each rubric
    const evaluationPromises = rubrics.map(async (rubric) => {
      try {
        console.log(`Evaluating rubric: ${rubric.name}`);
        const evaluations = await llmEvaluationService.evaluateRubric(
          rubric.name,
          rubric.description,
          candidateResponse
        );
        
        const scores = evaluations.map(e => e.score);
        const scoreVariance = llmEvaluationService.calculateScoreVariance(scores);
        
        console.log(`Completed evaluation for rubric: ${rubric.name}`, {
          scores,
          variance: scoreVariance.variance,
          status: scoreVariance.status
        });
        
        return {
          rubricId: rubric._id.toString(),
          rubricName: rubric.name,
          evaluations,
          scoreVariance
        };
      } catch (error) {
        console.error(`Error evaluating rubric ${rubric.name}:`, error);
        throw new Error(`Failed to evaluate rubric "${rubric.name}": ${error.message}`);
      }
    });
    
    const results: RubricEvaluationResponse[] = await Promise.all(evaluationPromises);
    
    // Check if all rubrics are green (within 20% variance)
    const allGreen = llmEvaluationService.areAllRubricsGreen(
      results.map(r => ({ rubricId: r.rubricId, scoreVariance: r.scoreVariance }))
    );
    
    return NextResponse.json({
      evaluations: results,
      allGreen,
      canSubmit: allGreen
    });
    
  } catch (error) {
    console.error('Error evaluating rubrics:', error);
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        error: 'Failed to evaluate rubrics',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}