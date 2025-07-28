import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import Notification from '../../../models/Notification';
import User from '../../../models/User';
import { FirebaseNotificationService } from '../../../services/firebaseService';

// GET - Fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const hours = parseInt(searchParams.get('hours') || '24');
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get notifications for this user (both individual and broadcast)
    const notifications = await Notification.find({
      $and: [
        {
          $or: [
            { type: 'broadcast' },
            { type: 'individual', targetUser: username }
          ]
        },
        { createdAt: { $gte: hoursAgo } },
        { isActive: true }
      ]
    }).sort({ createdAt: -1 });

    // Filter out notifications that user has already read
    const unreadNotifications = notifications.filter(notification => 
      !notification.readBy.some(read => read.username === username)
    );

    return NextResponse.json({
      notifications: unreadNotifications,
      count: unreadNotifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Create and send a new notification
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { title, message, type, targetUser, adminKey } = body;

    // Simple admin authentication - in production, use proper JWT or API key
    if (adminKey !== process.env.ADMIN_API_KEY) {
      console.log("Invalid", adminKey, process.env.ADMIN_API_KEY)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (!title || !message || !type) {
      return NextResponse.json({ 
        error: 'Title, message, and type are required' 
      }, { status: 400 });
    }

    if (type === 'individual' && !targetUser) {
      return NextResponse.json({ 
        error: 'Target user is required for individual notifications' 
      }, { status: 400 });
    }

    // Create notification in database
    const notification = new Notification({
      title,
      message,
      type,
      targetUser: type === 'individual' ? targetUser : undefined
    });

    await notification.save();

    // Send push notifications
    let users: any[] = [];
    let sendResults = { success: 0, failure: 0, failedTokens: [] as string[] };

    if (type === 'individual') {
      // Send to specific user
      const user = await User.findOne({ 
        username: targetUser, 
        notificationsEnabled: true,
        fcmToken: { $exists: true, $ne: null }
      });

      if (user && user.fcmToken) {
        users = [user];
        const success = await FirebaseNotificationService.sendToToken(
          user.fcmToken,
          {
            title,
            message,
            data: {
              notificationId: (notification._id as any).toString(),
              type: 'notification'
            }
          }
        );
        sendResults = {
          success: success ? 1 : 0,
          failure: success ? 0 : 1,
          failedTokens: success ? [] : [user.fcmToken]
        };
      }
    } else {
      // Send to all users with notifications enabled
      users = await User.find({ 
        notificationsEnabled: true,
        fcmToken: { $exists: true, $ne: null }
      });

      if (users.length > 0) {
        const tokens = users.map(user => user.fcmToken).filter(token => token);
        sendResults = await FirebaseNotificationService.sendToMultipleTokens(
          tokens,
          {
            title,
            message,
            data: {
              notificationId: (notification._id as any).toString(),
              type: 'notification'
            }
          }
        );
      }
    }

    // Remove invalid tokens
    if (sendResults.failedTokens.length > 0) {
      await User.updateMany(
        { fcmToken: { $in: sendResults.failedTokens } },
        { $unset: { fcmToken: 1 } }
      );
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetUser: notification.targetUser,
        createdAt: notification.createdAt
      },
      sendResults: {
        targetUsers: users.length,
        ...sendResults
      }
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}