/**
 * Send Notice to Android App via Firebase Admin SDK
 * Run: node send_notice_fcm.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Downloaded from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function sendNoticeNotification() {
  const noticeData = {
    noticeId: 'notice_' + Date.now(),
    title: 'বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৬ এর চূড়ান্ত নোটিশ',
    category: 'খেলাধুলা', // 'পড়ালেখা' | 'খেলাধুলা' | 'পরীক্ষা' | 'সাধারণ'
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    timestamp: String(Date.now()),
    description: 'সকল ছাত্রছাত্রীকে নির্দিষ্ট সময়ের মধ্যে মাঠে উপস্থিত থাকতে বলা হচ্ছে।',
    fileSize: '1.8 MB',
  };

  // Construct message payload
  const message = {
    topic: 'all_notices', // or use 'token': 'TARGET_DEVICE_FCM_TOKEN'
    
    // Notification block: Displays standard Android System Tray Notification
    notification: {
      title: `[${noticeData.category}] ${noticeData.title}`,
      body: 'নতুন বিজ্ঞপ্তি সংযুক্ত হয়েছে। বিস্তারিত দেখতে ট্যাপ করুন।',
    },

    // CRITICAL: Data payload: Read in the background / killed state by Android Headless JS!
    data: noticeData,

    // Android specific configuration for wake lock & instant heads-up popup
    android: {
      priority: 'high',
      notification: {
        channelId: 'notice_board_high_importance',
        sound: 'default',
        priority: 'max',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK', // For Flutter
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notice message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

sendNoticeNotification();
