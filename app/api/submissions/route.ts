import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import Submission from '../../../models/Submission';
import User from '../../../models/User';
import llmEvaluationService from '../../../services/llmEvaluationService';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    console.log('Received submission request:', JSON.stringify(body, null, 2));
    
    const { taskId, llmResponses, rubrics, messages, username } = body;
    
    console.log('Parsed submission data:', {
      taskId,
      llmResponsesCount: llmResponses?.length || 0,
      rubricsCount: rubrics?.length || 0,
      messagesCount: messages?.length || 0,
      username,
      rubricStructure: rubrics?.map((r: any) => ({
        rubricId: r.rubricId,
        evaluationsCount: r.evaluations?.length || 0,
        evaluations: r.evaluations
      }))
    });
    
    if (!taskId || !llmResponses || !rubrics || !username) {
      console.error('Missing required fields:', {
        taskId: !!taskId,
        llmResponses: !!llmResponses,
        rubrics: !!rubrics,
        username: !!username
      });
      return NextResponse.json(
        { error: 'taskId, llmResponses, rubrics, and username are required' },
        { status: 400 }
      );
    }

    // Calculate score variance for each rubric from evaluations
    const rubricsWithVariance = rubrics.map((rubric: any) => {
      const scores = rubric.evaluations?.map((e: any) => e.score) || [];
      const scoreVariance = llmEvaluationService.calculateScoreVariance(scores);
      
      console.log(`Rubric ${rubric.rubricId} variance calculation:`, {
        scores,
        scoreVariance
      });
      
      return {
        rubricId: rubric.rubricId,
        scoreVariance
      };
    });
    
    // Validate that all rubrics have green status (within 10% variance)
    const allGreen = llmEvaluationService.areAllRubricsGreen(rubricsWithVariance);
    
    console.log('All rubrics green status:', allGreen);
    console.log('Rubrics variance summary:', rubricsWithVariance.map((r: any) => ({
      rubricId: r.rubricId,
      status: r.scoreVariance.status,
      variance: r.scoreVariance.variance
    })));

    if (!allGreen) {
      console.error('Submission blocked due to non-green rubrics');
      return NextResponse.json(
        { error: 'Cannot submit: one or more rubrics have score variance > 10%. All rubrics must be in green status.' },
        { status: 400 }
      );
    }

    // Find user by username to get wallet address
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const newSubmission = new Submission({
      taskId,
      llmResponses,
      rubrics,
      messages: messages || [],
      walletAddress: user.walletAddress
    });
    
    const savedSubmission = await newSubmission.save();

    // Award 1 point to the user
    await User.findByIdAndUpdate(user._id, {
      $inc: { points: 1 }
    });

    // Get user's new rank after points update
    const updatedUser = await User.findById(user._id);
    const usersAhead = await User.countDocuments({
      $or: [
        { points: { $gt: updatedUser!.points } },
        { 
          points: updatedUser!.points, 
          createdAt: { $lt: updatedUser!.createdAt } 
        }
      ]
    });

    const position = usersAhead + 1;
    
    const response = {
      success: true,
      position,
      submissionId: savedSubmission._id,
      pointsAwarded: 1,
      totalPoints: updatedUser!.points
    };
    
    console.log('Submission successful:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json(
      { error: 'Failed to submit evaluation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}