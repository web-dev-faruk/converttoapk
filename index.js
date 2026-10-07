/**
 * @format
 * Root entry point for Android React Native Application
 */
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { StorageService } from './src/services/StorageService';

// =========================================================================
// CRITICAL: setBackgroundMessageHandler MUST be registered OUTSIDE the App
// component lifecycle. This allows Android Headless JS to run in background
// even if the user has killed/closed the application!
// =========================================================================
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM Background] Message handled in the background!', remoteMessage);

  if (remoteMessage.data) {
    const { noticeId, title, category, pdfUrl, timestamp, description, fileSize } = remoteMessage.data;

    // Automatically parse and save into AsyncStorage
    await StorageService.saveNotice({
      id: noticeId || 'fcm_' + Date.now(),
      title: title || 'নতুন বিজ্ঞপ্তি',
      category: category || 'সাধারণ',
      pdfUrl: pdfUrl || '',
      timestamp: timestamp ? Number(timestamp) : Date.now(),
      description: description || '',
      fileSize: fileSize || '1.0 MB',
    });

    console.log('[FCM Background] Notice auto-saved to local storage while app was closed!');
  }
});

AppRegistry.registerComponent(appName, () => App);
