import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongoose';
import Notification from '../../../../models/Notification';

// POST - Mark notification as read
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { notificationId, username } = body;

    if (!notificationId || !username) {
      return NextResponse.json({ 
        error: 'Notification ID and username are required' 
      }, { status: 400 });
    }

    // Check if notification exists
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Check if user is already in readBy array
    const alreadyRead = notification.readBy.some(read => read.username === username);
    
    if (!alreadyRead) {
      // Add user to readBy array
      notification.readBy.push({
        username,
        readAt: new Date()
      });
      await notification.save();
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}