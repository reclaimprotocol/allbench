import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import Submission from '../../../models/Submission';
import User from '../../../models/User';
import llmEvaluationService from '../../../services/llmEvaluationService';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { taskId, llmResponses, rubrics, messages, username } = body;
    
    if (!taskId || !llmResponses || !rubrics || !username) {
      return NextResponse.json(
        { error: 'taskId, llmResponses, rubrics, and username are required' },
        { status: 400 }
      );
    }

    // Validate that all rubrics have green status (within 20% variance)
    const allGreen = llmEvaluationService.areAllRubricsGreen(
      rubrics.map((rubric: any) => ({
        rubricId: rubric.rubricId,
        scoreVariance: {
          status: rubric.scoreVariance?.status || 'red',
          scores: rubric.evaluations?.map((e: any) => e.score) || [],
          variance: rubric.scoreVariance?.variance || 100
        }
      }))
    );

    if (!allGreen) {
      return NextResponse.json(
        { error: 'Cannot submit: one or more rubrics have score variance > 20%. All rubrics must be in green status.' },
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
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
}