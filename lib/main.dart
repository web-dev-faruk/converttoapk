import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

// =========================================================================
// CRITICAL: Top-level background message handler for Flutter
// Annotated with @pragma('vm:entry-point') so it survives tree shaking
// =========================================================================
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling a background message: ${message.messageId}');

  if (message.data.isNotEmpty) {
    await StorageService.saveNoticeFromData(message.data);
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Set the background messaging handler early on
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  runApp(const NoticeBoardApp());
}

class NoticeBoardApp extends StatelessWidget {
  const NoticeBoardApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'নোটিশ বোর্ড',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primaryColor: const Color(0xFF3B82F6),
        fontFamily: 'HindSiliguri',
      ),
      home: const NoticeBoardHomePage(),
    );
  }
}

class NoticeBoardHomePage extends StatefulWidget {
  const NoticeBoardHomePage({Key? key}) : super(key: key);

  @override
  State<NoticeBoardHomePage> createState() => _NoticeBoardHomePageState();
}

class _NoticeBoardHomePageState extends State<NoticeBoardHomePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<NoticeModel> _notices = [];
  bool _isLoading = true;

  final List<String> _categories = [
    'সকল ನೋটিশ',
    'পড়ালেখা',
    'খেলাধুলা',
    'পরীক্ষা',
    'সাধারণ',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _categories.length, vsync: this);
    _loadNotices();
    _setupFCM();
  }

  void _setupFCM() async {
    // 1. Request notification permissions
    NotificationSettings settings =
        await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // 2. Fetch device token
    String? token = await FirebaseMessaging.instance.getToken();
    print('FCM Token: $token');

    // 3. Foreground listener
    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      if (message.data.isNotEmpty) {
        await StorageService.saveNoticeFromData(message.data);
        _loadNotices();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('নতুন নোটিশ: ${message.data['title'] ?? ''}'),
              action: SnackBarAction(
                label: 'দেখুন',
                onPressed: () => _openUrl(message.data['pdfUrl'] ?? ''),
              ),
            ),
          );
        }
      }
    });
  }

  Future<void> _loadNotices() async {
    setState(() => _isLoading = true);
    final items = await StorageService.getNotices();
    setState(() {
      _notices = items;
      _isLoading = false;
    });
  }

  Future<void> _deleteNotice(String id) async {
    await StorageService.deleteNotice(id);
    _loadNotices();
  }

  Future<void> _clearAllNotices() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('সব নোটিশ মুছুন'),
        content: const Text('আপনি কি নিশ্চিত যে সকল নোটিশ মুছে ফেলতে চান?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('বাতিল', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('মুছুন'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await StorageService.clearAll();
      _loadNotices();
    }
  }

  Future<void> _openUrl(String url) async {
    if (url.isEmpty) return;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  List<NoticeModel> _getFilteredNotices(int index) {
    if (index == 0) return _notices;
    final catName = _categories[index];
    return _notices.where((n) => n.category == catName).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        title: const Text(
          'নোটিশ বোর্ড',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
        ),
        actions: [
          if (_notices.isNotEmpty)
            TextButton(
              onPressed: _clearAllNotices,
              child: const Text(
                'সব মুছুন',
                style: TextStyle(color: Colors.redAccent, fontSize: 13),
              ),
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: const Color(0xFF3B82F6),
          labelColor: Colors.white,
          unselectedLabelColor: const Color(0xFF94A3B8),
          tabs: _categories.map((c) => Tab(text: c)).toList(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: List.generate(_categories.length, (index) {
                final list = _getFilteredNotices(index);
                if (list.isEmpty) {
                  return const Center(
                    child: Text(
                      'কোনো নোটিশ নেই',
                      style: TextStyle(color: Color(0xFF64748B)),
                    ),
                  );
                }
                return RefreshIndicator(
                  onRefresh: _loadNotices,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: list.length,
                    itemBuilder: (ctx, i) {
                      final item = list[i];
                      return NoticeTile(
                        item: item,
                        onOpenPdf: () => _openUrl(item.pdfUrl),
                        onDelete: () => _deleteNotice(item.id),
                      );
                    },
                  ),
                );
              }),
            ),
    );
  }
}

class NoticeModel {
  final String id;
  final String title;
  final String category;
  final String pdfUrl;
  final int timestamp;

  NoticeModel({
    required this.id,
    required this.title,
    required this.category,
    required this.pdfUrl,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'category': category,
        'pdfUrl': pdfUrl,
        'timestamp': timestamp,
      };

  factory NoticeModel.fromMap(Map<String, dynamic> map) => NoticeModel(
        id: map['id'] ?? '',
        title: map['title'] ?? '',
        category: map['category'] ?? 'সাধারণ',
        pdfUrl: map['pdfUrl'] ?? '',
        timestamp: map['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
      );
}

class StorageService {
  static const String _key = 'notices_list_v1';

  static Future<List<NoticeModel>> getNotices() async {
    final sp = await SharedPreferences.getInstance();
    final raw = sp.getStringList(_key) ?? [];
    final list = raw.map((s) => NoticeModel.fromMap(jsonDecode(s))).toList();
    // Sort latest first
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  static Future<void> saveNoticeFromData(Map<String, dynamic> data) async {
    final notice = NoticeModel(
      id: data['noticeId'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      title: data['title'] ?? 'নতুন বিজ্ঞপ্তি',
      category: data['category'] ?? 'সাধারণ',
      pdfUrl: data['pdfUrl'] ?? '',
      timestamp: int.tryParse(data['timestamp'] ?? '') ??
          DateTime.now().millisecondsSinceEpoch,
    );

    final list = await getNotices();
    list.removeWhere((item) => item.id == notice.id);
    list.insert(0, notice);
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));

    final sp = await SharedPreferences.getInstance();
    await sp.setStringList(
      _key,
      list.map((n) => jsonEncode(n.toMap())).toList(),
    );
  }

  static Future<void> deleteNotice(String id) async {
    final list = await getNotices();
    list.removeWhere((item) => item.id == id);
    final sp = await SharedPreferences.getInstance();
    await sp.setStringList(
      _key,
      list.map((n) => jsonEncode(n.toMap())).toList(),
    );
  }

  static Future<void> clearAll() async {
    final sp = await SharedPreferences.getInstance();
    await sp.remove(_key);
  }
}

class NoticeTile extends StatelessWidget {
  final NoticeModel item;
  final VoidCallback onOpenPdf;
  final VoidCallback onDelete;

  const NoticeTile({
    Key? key,
    required this.item,
    required this.onOpenPdf,
    required this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                item.category,
                style: const TextStyle(
                  color: Color(0xFF38BDF8),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Text(' · ', style: TextStyle(color: Color(0xFF64748B))),
              Text(
                DateTime.fromMillisecondsSinceEpoch(item.timestamp)
                    .toString()
                    .substring(0, 16),
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            item.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (item.pdfUrl.isNotEmpty)
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onPressed: onOpenPdf,
                  icon: const Icon(Icons.picture_as_pdf, size: 16),
                  label: const Text('পিডিএফ খুলুন', style: TextStyle(fontSize: 12)),
                )
              else
                const Text('কোনো ফাইল নেই', style: TextStyle(color: Colors.grey, fontSize: 12)),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                onPressed: onDelete,
                tooltip: 'মুছুন',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
