import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongoose';
import Rubric from '../../../../models/Rubric';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }
    
    const searchQuery: any = { taskId };
    
    if (query) {
      searchQuery.name = { $regex: query, $options: 'i' };
    }
    
    const rubrics = await Rubric.find(searchQuery).sort({ createdAt: -1 });
    
    // Transform the MongoDB documents to match frontend expectations
    const transformedRubrics = rubrics.map(rubric => ({
      id: rubric._id.toString(),
      name: rubric.name,
      description: rubric.description,
      taskId: rubric.taskId
    }));
    
    return NextResponse.json(transformedRubrics);
  } catch (error) {
    console.error('Error searching rubrics:', error);
    return NextResponse.json(
      { error: 'Failed to search rubrics' },
      { status: 500 }
    );
  }
}