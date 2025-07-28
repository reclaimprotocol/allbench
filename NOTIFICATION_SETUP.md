# AllBench Notification System Setup

## Overview

The AllBench notification system allows administrators to send push notifications to users either individually or as broadcasts. Users can opt-in to receive notifications about new models and experiments.

## Features

- ✅ Admin panel for sending notifications
- ✅ Individual and broadcast notifications
- ✅ User opt-in permission flow
- ✅ Push notifications with FCM
- ✅ Unread notification modal on app open
- ✅ Notification read status tracking
- ✅ System tray notifications

## Backend Setup

### 1. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Cloud Messaging
3. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com

# Admin API Key for notification sending
ADMIN_API_KEY=your-secure-admin-key
```

### 3. Database Models

The system uses two main models:

- **User**: Extended with `fcmToken` and `notificationsEnabled` fields
- **Notification**: Stores notification data and read status

### 4. API Endpoints

- `POST /api/notifications` - Send notifications (admin only)
- `GET /api/notifications` - Get unread notifications for user
- `POST /api/notifications/read` - Mark notification as read
- `POST /api/users/fcm-token` - Update user FCM token and preferences

## Frontend Setup (React Native)

### 1. Expo Configuration

The app uses Expo notifications. Make sure you have:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### 2. Notification Flow

1. **User Signup**: After username setup, user sees notification permission modal
2. **Permission Request**: App requests native notification permissions
3. **FCM Token**: If granted, app gets FCM token and sends to backend
4. **App Launch**: App checks for unread notifications from last 24 hours
5. **Notification Display**: Unread notifications show in modal
6. **Read Tracking**: Tapping notifications marks them as read

## Admin Usage

### Accessing Admin Panel

1. Navigate to `/admin/notifications` in your backend URL
2. Enter the admin API key
3. Choose notification type:
   - **Broadcast**: Sends to all users with notifications enabled
   - **Individual**: Sends to specific username

### Sending Notifications

1. Fill in title (max 100 chars) and message (max 500 chars)
2. For individual notifications, specify target username
3. Click "Send Notification"
4. See delivery results (success/failure counts)

## User Experience

### First Time Setup

1. User completes username registration
2. Notification permission modal appears with benefits:
   - New model releases
   - Experiment opportunities
   - Important updates
3. User can "Enable Notifications" or "Not Now"
4. If enabled, native permission dialog appears
5. FCM token stored on backend if granted

### Receiving Notifications

1. **Push Notifications**: Appear in system tray
2. **App Launch**: Modal shows unread notifications from last 24 hours
3. **Tapping**: Marks individual notifications as read
4. **Closing Modal**: Marks all visible notifications as read

## Technical Details

### Notification Data Structure

```typescript
interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'individual' | 'broadcast';
  targetUser?: string;
  createdAt: string;
  readBy: Array<{
    username: string;
    readAt: Date;
  }>;
}
```

### FCM Token Management

- Tokens are validated before storing
- Invalid tokens are automatically cleaned up
- Users can disable notifications without removing tokens

### Read Status Tracking

- Notifications track which users have read them
- Only unread notifications from last 24 hours are shown
- System tray taps and modal interactions mark as read

## Troubleshooting

### Common Issues

1. **Notifications not sending**: Check Firebase service account credentials
2. **Invalid tokens**: Tokens are automatically cleaned up on failure
3. **Permissions denied**: Users need to manually enable in device settings
4. **Admin access**: Verify ADMIN_API_KEY environment variable

### Testing

1. Use admin panel to send test notifications
2. Check notification delivery in Firebase Console
3. Test with different user scenarios (enabled/disabled notifications)
4. Verify read status tracking in database

## Security Considerations

- Admin API key should be secure and not exposed
- FCM tokens are sensitive and stored securely
- Notification content should be validated
- Rate limiting should be implemented for production

## Future Enhancements

- Notification categories and preferences
- Scheduled notifications
- Rich media notifications
- Analytics and delivery tracking
- Bulk user targeting