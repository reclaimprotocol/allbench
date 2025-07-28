import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongoose';
import User from '../../../../models/User';
import { FirebaseNotificationService } from '../../../../services/firebaseService';

// POST - Update user's FCM token and notification preferences
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { username, fcmToken, notificationsEnabled } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate FCM token if provided
    if (fcmToken) {
      const isValidToken = await FirebaseNotificationService.validateToken(fcmToken);
      if (!isValidToken) {
        return NextResponse.json({ error: 'Invalid FCM token' }, { status: 400 });
      }
    }

    // Update user's FCM token and notification preferences
    const updateData: any = {};
    
    if (fcmToken !== undefined) {
      updateData.fcmToken = fcmToken;
    }
    
    if (notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = notificationsEnabled;
    }

    await User.findByIdAndUpdate(user._id, updateData);

    return NextResponse.json({ 
      success: true, 
      message: 'FCM token and preferences updated successfully',
      notificationsEnabled: updateData.notificationsEnabled ?? user.notificationsEnabled
    });

  } catch (error) {
    console.error('Error updating FCM token:', error);
    return NextResponse.json({ error: 'Failed to update FCM token' }, { status: 500 });
  }
}

// GET - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const user = await User.findOne({ username }, 'notificationsEnabled fcmToken');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      notificationsEnabled: user.notificationsEnabled,
      hasToken: !!user.fcmToken
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch notification preferences' }, { status: 500 });
  }
}