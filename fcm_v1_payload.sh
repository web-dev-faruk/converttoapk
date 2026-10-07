#!/bin/bash
# Send Notice using Firebase Cloud Messaging HTTP v1 API
# Replace YOUR_PROJECT_ID and YOUR_OAUTH2_ACCESS_TOKEN

curl -X POST https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send \
  -H "Authorization: Bearer YOUR_OAUTH2_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "topic": "all_notices",
      "notification": {
        "title": "[পড়ালেখা] একাদশ শ্রেণির প্রথম সাময়িক পরীক্ষার রুটিন প্রকাশ",
        "body": "পিডিএফ রুটিন ডাউনলোড করতে এখানে চাপুন।"
      },
      "data": {
        "noticeId": "notice_2026_001",
        "title": "একাদশ শ্রেণির প্রথম সাময়িক পরীক্ষার রুটিন প্রকাশ",
        "category": "পড়ালেখা",
        "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        "timestamp": "1775560000000",
        "description": "পরীক্ষা আগামী ২০ অক্টোবর থেকে শুরু হবে।",
        "fileSize": "2.1 MB"
      },
      "android": {
        "priority": "HIGH"
      }
    }
  }'
