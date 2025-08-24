import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import Rubric from '../../../models/Rubric';
import llmEvaluationService, { LLMEvaluationResult, ScoreVariance } from '../../../services/llmEvaluationService';

interface EvaluateRubricsRequest {
  rubricIds: string[];
  candidateResponses: { llmName: string; response: string; }[];
}

interface CandidateResponseEvaluation {
  candidateLlmName: string;
  evaluations: LLMEvaluationResult[];
  scoreVariance: ScoreVariance;
}

interface RubricEvaluationResponse {
  rubricId: string;
  rubricName: string;
  candidateEvaluations: CandidateResponseEvaluation[];
  overallScoreVariance: ScoreVariance;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body: EvaluateRubricsRequest = await request.json();
    const { rubricIds, candidateResponses } = body;
    
    if (!rubricIds || !Array.isArray(rubricIds) || rubricIds.length === 0) {
      return NextResponse.json(
        { error: 'rubricIds array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!candidateResponses || !Array.isArray(candidateResponses) || candidateResponses.length === 0) {
      return NextResponse.json(
        { error: 'candidateResponses array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate each candidate response
    for (const candidate of candidateResponses) {
      if (!candidate.llmName || !candidate.response || candidate.response.trim().length === 0) {
        return NextResponse.json(
          { error: 'Each candidate response must have llmName and non-empty response' },
          { status: 400 }
        );
      }
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
      candidateCount: candidateResponses.length,
      candidateNames: candidateResponses.map(c => c.llmName)
    });

    // Evaluate each rubric against each candidate response
    const evaluationPromises = rubrics.map(async (rubric) => {
      try {
        console.log(`Evaluating rubric: ${rubric.name}`);
        
        // Evaluate this rubric against each candidate response
        const candidateEvaluations: CandidateResponseEvaluation[] = [];
        
        for (const candidate of candidateResponses) {
          console.log(`Evaluating candidate: ${candidate.llmName} with rubric: ${rubric.name}`);
          
          const evaluations = await llmEvaluationService.evaluateRubric(
            rubric.name,
            rubric.description,
            candidate.response
          );
          
          const scores = evaluations.map(e => e.score);
          const scoreVariance = llmEvaluationService.calculateScoreVariance(scores);
          
          candidateEvaluations.push({
            candidateLlmName: candidate.llmName,
            evaluations,
            scoreVariance
          });
          
          console.log(`Completed evaluation for candidate: ${candidate.llmName}`, {
            scores,
            variance: scoreVariance.variance,
            status: scoreVariance.status
          });
        }
        
        // Calculate overall variance across all candidates for this rubric
        const allScores = candidateEvaluations.flatMap(ce => ce.evaluations.map(e => e.score));
        const overallScoreVariance = llmEvaluationService.calculateScoreVariance(allScores);
        
        return {
          rubricId: rubric._id.toString(),
          rubricName: rubric.name,
          candidateEvaluations,
          overallScoreVariance
        };
      } catch (error) {
        console.error(`Error evaluating rubric ${rubric.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to evaluate rubric "${rubric.name}": ${errorMessage}`);
      }
    });
    
    const results: RubricEvaluationResponse[] = await Promise.all(evaluationPromises);
    
    // Check if all rubrics are green (within variance threshold) across all candidate responses
    const allGreen = results.every(rubric => 
      rubric.overallScoreVariance.status === 'green' &&
      rubric.candidateEvaluations.every(candidate => candidate.scoreVariance.status === 'green')
    );
    
    console.log('Evaluation complete:', {
      rubricCount: results.length,
      allGreen,
      overallStatuses: results.map(r => ({
        rubric: r.rubricName,
        overall: r.overallScoreVariance.status,
        candidates: r.candidateEvaluations.map(c => ({ name: c.candidateLlmName, status: c.scoreVariance.status }))
      }))
    });
    
    return NextResponse.json({
      evaluations: results,
      allGreen,
      canSubmit: allGreen
    });
    
  } catch (error) {
    console.error('Error evaluating rubrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    const errorName = error instanceof Error ? error.name : 'Unknown error type';
    
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to evaluate rubrics',
        details: errorMessage,
        type: errorName
      },
      { status: 500 }
    );
  }
}