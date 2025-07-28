import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import Task from '../../../models/Task';

export async function GET() {
  try {
    await connectDB();
    const tasks = await Task.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}