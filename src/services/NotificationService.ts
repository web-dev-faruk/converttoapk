import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { StorageService, NoticeItem } from './StorageService';

type OnNoticeReceivedCallback = (notice: NoticeItem) => void;

export class NotificationService {
  private static onNoticeReceivedListener: OnNoticeReceivedCallback | null = null;

  /**
   * Initialize Firebase Cloud Messaging listeners and request permissions
   */
  public static async init(onNoticeReceived?: OnNoticeReceivedCallback): Promise<void> {
    if (onNoticeReceived) {
      this.onNoticeReceivedListener = onNoticeReceived;
    }

    // 1. Request notification permissions (Android 13+ requires POST_NOTIFICATIONS)
    await this.requestPermission();

    // 2. Fetch and log FCM device token (Send this to your backend server)
    const token = await this.getFCMToken();
    console.log('[FCM] Device Registration Token:', token);

    // 3. Setup Foreground Message Listener
    messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('[FCM] Foreground notification received:', remoteMessage);
      const savedNotice = await this.parseAndSavePayload(remoteMessage.data);
      if (savedNotice && this.onNoticeReceivedListener) {
        this.onNoticeReceivedListener(savedNotice);
      }
    });

    // 4. Handle notification opened from background state
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[FCM] Notification caused app to open from background:', remoteMessage);
      if (remoteMessage.data) {
        this.parseAndSavePayload(remoteMessage.data);
      }
    });

    // 5. Handle notification opened from completely closed/killed state
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('[FCM] App opened from quit state via notification:', initialNotification);
      if (initialNotification.data) {
        await this.parseAndSavePayload(initialNotification.data);
      }
    }
  }

  /**
   * Request Android 13+ POST_NOTIFICATIONS runtime permission
   */
  public static async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      }
    } catch (err) {
      console.error('[FCM] Permission request failed:', err);
      return false;
    }
  }

  /**
   * Get FCM Device Token to send push notifications from your server
   */
  public static async getFCMToken(): Promise<string | null> {
    try {
      return await messaging().getToken();
    } catch (err) {
      console.error('[FCM] Failed to get device token:', err);
      return null;
    }
  }

  /**
   * Parses FCM 'data' payload and stores it immediately into local storage
   */
  public static async parseAndSavePayload(data: any): Promise<NoticeItem | null> {
    if (!data) return null;

    try {
      const notice: NoticeItem = {
        id: data.noticeId || 'fcm_' + Date.now(),
        title: data.title || 'বিজ্ঞপ্তি শিরোনাম নেই',
        category: data.category || 'সাধারণ',
        pdfUrl: data.pdfUrl || '',
        timestamp: data.timestamp ? Number(data.timestamp) : Date.now(),
        description: data.description || '',
        fileSize: data.fileSize || '1.2 MB',
      };

      await StorageService.saveNotice(notice);
      console.log('[FCM] Successfully parsed and persisted notice:', notice.title);
      return notice;
    } catch (err) {
      console.error('[FCM] Error saving payload to local storage:', err);
      return null;
    }
  }
}
