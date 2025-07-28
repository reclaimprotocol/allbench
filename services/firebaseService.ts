import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // In production, use environment variables for the service account
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
          // For development - replace with your actual service account
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID || "allbench-notifications",
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
        };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export interface NotificationPayload {
  title: string;
  message: string;
  data?: Record<string, string>;
}

export class FirebaseNotificationService {
  static async sendToToken(token: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.message,
        },
        data: payload.data || {},
        token: token,
        android: {
          notification: {
            channelId: 'allbench_notifications',
            priority: 'high' as const,
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  static async sendToMultipleTokens(tokens: string[], payload: NotificationPayload): Promise<{
    success: number;
    failure: number;
    failedTokens: string[];
  }> {
    try {
      if (tokens.length === 0) {
        return { success: 0, failure: 0, failedTokens: [] };
      }

      const message = {
        notification: {
          title: payload.title,
          body: payload.message,
        },
        data: payload.data || {},
        android: {
          notification: {
            channelId: 'allbench_notifications',
            priority: 'high' as const,
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast({
        ...message,
        tokens: tokens,
      });

      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error('Failed to send to token:', tokens[idx], resp.error);
        }
      });

      console.log(`Successfully sent ${response.successCount} messages`);
      return {
        success: response.successCount,
        failure: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      console.error('Error sending multicast message:', error);
      return { success: 0, failure: tokens.length, failedTokens: tokens };
    }
  }

  static async validateToken(token: string): Promise<boolean> {
    try {
      // Try to send a validation message (dry run)
      await admin.messaging().send({
        token: token,
        notification: {
          title: 'Test',
          body: 'Test',
        },
      }, true); // dry run
      return true;
    } catch (error) {
      console.error('Invalid token:', token, error);
      return false;
    }
  }
}

export default admin;