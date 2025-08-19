import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import Rubric from '../../../models/Rubric';

export async function GET() {
  try {
    await connectDB();
    const rubrics = await Rubric.find({}).sort({ createdAt: -1 });
    
    // Transform the MongoDB documents to match frontend expectations
    const transformedRubrics = rubrics.map(rubric => ({
      id: rubric._id.toString(),
      name: rubric.name,
      description: rubric.description,
      taskId: rubric.taskId
    }));
    
    return NextResponse.json(transformedRubrics);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubrics' },
      { status: 500 }
    );
  }
}

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