import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NoticeItem {
  id: string;
  title: string;
  category: string; // 'পড়ালেখা' | 'খেলাধুলা' | 'পরীক্ষা' | 'সাধারণ'
  pdfUrl: string;
  timestamp: number; // Milliseconds since epoch
  description?: string;
  fileSize?: string;
}

export type CategoryKey = 'all' | 'education' | 'sports' | 'exams' | 'general';

const STORAGE_KEY = '@notice_board_app:notices_v1';

export class StorageService {
  /**
   * Retrieve all saved notices from device local storage
   * Sorted strictly by "Latest First" (timestamp descending)
   */
  public static async getNotices(): Promise<NoticeItem[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (!jsonValue) return [];

      const parsed: NoticeItem[] = JSON.parse(jsonValue);
      // Guarantee newest notices appear at the very top
      return parsed.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('[Storage] Error reading notices:', error);
      return [];
    }
  }

  /**
   * Save a new notice (e.g. received via FCM background/foreground)
   * Deduplicates by ID and preserves latest-first order
   */
  public static async saveNotice(notice: NoticeItem): Promise<NoticeItem[]> {
    try {
      const current = await this.getNotices();
      // Remove any existing item with the same ID
      const filtered = current.filter((item) => item.id !== notice.id);
      // Add the new notice at the top and sort
      const updated = [notice, ...filtered].sort((a, b) => b.timestamp - a.timestamp);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('[Storage] Error saving notice:', error);
      throw error;
    }
  }

  /**
   * Delete an individual notice by ID
   */
  public static async deleteNotice(id: string): Promise<NoticeItem[]> {
    try {
      const current = await this.getNotices();
      const updated = current.filter((item) => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('[Storage] Error deleting notice:', error);
      throw error;
    }
  }

  /**
   * Clear all notices or all notices belonging to a category
   */
  public static async clearNotices(categoryRaw?: string): Promise<NoticeItem[]> {
    try {
      if (!categoryRaw || categoryRaw === 'all') {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return [];
      } else {
        const current = await this.getNotices();
        const updated = current.filter((item) => item.category !== categoryRaw);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }
    } catch (error) {
      console.error('[Storage] Error clearing notices:', error);
      throw error;
    }
  }
}
