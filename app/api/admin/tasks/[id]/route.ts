import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongoose';
import Task from '../../../../../models/Task';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, description, logo, requiredCredentials, active, systemPrompt, helperSystemPrompt } = body;
    
    // Generate unique IDs for credentials if not provided
    const processedCredentials = (requiredCredentials || []).map((cred: any) => ({
      id: cred.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: cred.name,
      logo: cred.logo,
      reclaimProviderId: cred.reclaimProviderId
    }));
    
    const { id } = await params;
    console.log(id);
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      {
        name,
        description,
        logo,
        requiredCredentials: processedCredentials,
        active: active !== undefined ? active : true,
        systemPrompt: systemPrompt,
        helperSystemPrompt: helperSystemPrompt
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Transform _id to id for frontend compatibility
    const transformedTask = {
      ...updatedTask.toObject(),
      id: updatedTask._id.toString(),
      _id: undefined
    };
    
    return NextResponse.json(transformedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const deletedTask = await Task.findByIdAndDelete(id);
    
    if (!deletedTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}