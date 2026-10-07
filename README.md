# Android Notice Board Application (FCM Realtime + Offline Storage)

This production project implements:
1. Categorized tabs ("পড়ালেখা", "খেলাধুলা", "পরীক্ষা", "সাধারণ", "সকল নোটিশ")
2. "Latest First" sorting with local storage persistence (AsyncStorage / SQLite / SharedPreferences)
3. Direct PDF/URL link launcher
4. Individual notice delete & "Clear All" actions
5. Firebase Cloud Messaging (FCM) foreground, background, and killed-state parsing

## How to add google-services.json
1. Open Firebase Console: https://console.firebase.google.com
2. Select or create your project.
3. Add an Android app with package name matching your app (e.g. `com.noticeboard.app`).
4. Download `google-services.json` from Project Settings > Your Apps.
5. Place the file inside:
   - For React Native: `android/app/google-services.json`
   - For Flutter: `android/app/google-services.json`

## Running the App
- React Native:
  `npm install`
  `npx react-native run-android`
- Flutter:
  `flutter pub get`
  `flutter run`
