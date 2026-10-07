import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  NotificationService,
  StorageService,
  NoticeItem,
  CategoryKey,
} from './src/services';
import { NoticeCard } from './src/components/NoticeCard';
import { CategoryTabs } from './src/components/CategoryTabs';

export default function App() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load notices from local storage (AsyncStorage)
  const loadNotices = useCallback(async () => {
    try {
      const items = await StorageService.getNotices();
      setNotices(items);
    } catch (error) {
      console.error('Failed to load notices:', error);
      Alert.alert('ত্রুটি', 'বিজ্ঞপ্তি লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initialize FCM, Android 13 permissions & listen for notifications
  useEffect(() => {
    // 1. Initialize Notification Service
    NotificationService.init((newNotice) => {
      // Callback fired when a push notification is received in foreground
      // Automatically update the state so UI reflects the new notice immediately
      setNotices((prev) => [newNotice, ...prev.filter((n) => n.id !== newNotice.id)]);
      Alert.alert(
        'নতুন বিজ্ঞপ্তি!',
        `[${newNotice.category}] ${newNotice.title}`,
        [
          { text: 'পরে দেখুন', style: 'cancel' },
          {
            text: 'পিডিএফ খুলুন',
            onPress: () => openPdfLink(newNotice.pdfUrl),
          },
        ]
      );
    });

    // 2. Load stored notices from device local storage
    loadNotices();
  }, [loadNotices]);

  // Open PDF / Link in device browser or external viewer
  const openPdfLink = async (url: string) => {
    if (!url) {
      Alert.alert('বিজ্ঞপ্তি', 'কোনো পিডিএফ লিঙ্ক সংযুক্ত নেই।');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('ত্রুটি', 'এই লিঙ্কটি খোলা সম্ভব নয়: ' + url);
      }
    } catch (err) {
      console.error('Failed to open PDF URL:', err);
      Alert.alert('ত্রুটি', 'পিডিএফ লিঙ্ক খুলতে সমস্যা হয়েছে।');
    }
  };

  // Delete individual notice
  const handleDeleteNotice = (id: string, title: string) => {
    Alert.alert(
      'বিজ্ঞপ্তি মুছুন',
      `আপনি কি "${title}" বিজ্ঞপ্তিটি মুছে ফেলতে চান?`,
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'মুছুন',
          style: 'destructive',
          onPress: async () => {
            const updated = await StorageService.deleteNotice(id);
            setNotices(updated);
          },
        },
      ]
    );
  };

  // Clear all notices in current category or entire storage
  const handleClearAll = () => {
    const isAll = selectedCategory === 'all';
    const message = isAll
      ? 'আপনি কি সংরক্ষিত সকল নোটিশ মুছে ফেলতে চান?'
      : `আপনি কি "${getCategoryLabel(selectedCategory)}" ক্যাটাগরির সকল নোটিশ মুছে ফেলতে চান?`;

    Alert.alert('সব মুছুন (Clear All)', message, [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'সব মুছুন',
        style: 'destructive',
        onPress: async () => {
          const rawCategory = getCategoryRawName(selectedCategory);
          const updated = await StorageService.clearNotices(rawCategory);
          setNotices(updated);
        },
      },
    ]);
  };

  // Filter notices by selected category
  const filteredNotices = notices.filter((notice) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'education') return notice.category === 'পড়ালেখা';
    if (selectedCategory === 'sports') return notice.category === 'খেলাধুলা';
    if (selectedCategory === 'exams') return notice.category === 'পরীক্ষা';
    if (selectedCategory === 'general') return notice.category === 'সাধারণ';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>নোটিশ বোর্ড</Text>
          <Text style={styles.headerSubtitle}>
            {filteredNotices.length} টি নোটিশ সংরক্ষিত
          </Text>
        </View>

        {filteredNotices.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearAllText}>সব মুছুন</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Notice List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loaderText}>বিজ্ঞপ্তি লোড হচ্ছে...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoticeCard
              notice={item}
              onOpenPdf={() => openPdfLink(item.pdfUrl)}
              onDelete={() => handleDeleteNotice(item.id, item.title)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotices();
              }}
              colors={['#3b82f6']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>কোনো নোটিশ পাওয়া যায়নি</Text>
              <Text style={styles.emptySubtitle}>
                নতুন নোটিশ আসলে পুশ নোটিফিকেশনের মাধ্যমে এখানে যোগ হবে।
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function getCategoryLabel(key: CategoryKey): string {
  switch (key) {
    case 'education': return 'পড়ালেখা';
    case 'sports': return 'খেলাধুলা';
    case 'exams': return 'পরীক্ষা';
    case 'general': return 'সাধারণ';
    default: return 'সকল নোটিশ';
  }
}

function getCategoryRawName(key: CategoryKey): string | undefined {
  switch (key) {
    case 'education': return 'পড়ালেখা';
    case 'sports': return 'খেলাধুলা';
    case 'exams': return 'পরীক্ষা';
    case 'general': return 'সাধারণ';
    default: return undefined;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
