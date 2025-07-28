import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongoose';
import Task from '../../../../models/Task';
import { safeMap, safeToObject } from '../../../../lib/mongoUtils';

export async function GET() {
  try {
    await connectDB();
    const tasks = await Task.find({}).sort({ createdAt: -1 });
    
    // Use safe mapping to handle potential serialization issues
    const transformedTasks = await safeMap(tasks, (task: any) => {
      const taskObj = safeToObject(task);
      return {
        ...taskObj,
        id: task._id?.toString() || taskObj._id?.toString() || 'unknown',
        _id: undefined
      };
    });
    
    return NextResponse.json(transformedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, description, logo, requiredCredentials, active, systemPrompt, helperSystemPrompt } = body;
    
    if (!name || !description || !logo) {
      return NextResponse.json(
        { error: 'name, description, and logo are required' },
        { status: 400 }
      );
    }
    
    // Generate unique IDs for credentials if not provided
    const processedCredentials = (requiredCredentials || []).map((cred: any) => ({
      id: cred.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: cred.name,
      logo: cred.logo,
      reclaimProviderId: cred.reclaimProviderId
    }));
    
    const newTask = new Task({
      name,
      description,
      logo,
      requiredCredentials: processedCredentials,
      active: active !== undefined ? active : true,
      systemPrompt: systemPrompt,
      helperSystemPrompt: helperSystemPrompt
    });
    
    const savedTask = await newTask.save();
    
    // Transform _id to id for frontend compatibility
    const transformedTask = {
      ...savedTask.toObject(),
      id: savedTask._id.toString(),
      _id: undefined
    };
    
    return NextResponse.json(transformedTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}