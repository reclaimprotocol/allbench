import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import Rubric from '../../../models/Rubric';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, description, taskId } = body;
    
    if (!name || !description || !taskId) {
      return NextResponse.json(
        { error: 'name, description, and taskId are required' },
        { status: 400 }
      );
    }
    
    const newRubric = new Rubric({
      name,
      description,
      taskId
    });
    
    const savedRubric = await newRubric.save();
    
    // Transform the MongoDB document to match frontend expectations
    const rubricResponse = {
      id: savedRubric._id.toString(),
      name: savedRubric.name,
      description: savedRubric.description,
      taskId: savedRubric.taskId
    };
    
    return NextResponse.json(rubricResponse);
  } catch (error) {
    console.error('Error adding rubric:', error);
    return NextResponse.json(
      { error: 'Failed to add rubric' },
      { status: 500 }
    );
  }
}