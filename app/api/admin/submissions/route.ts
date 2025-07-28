import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongoose';
import Submission from '../../../../models/Submission';

export async function GET() {
  try {
    await connectDB();
    const submissions = await Submission.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}