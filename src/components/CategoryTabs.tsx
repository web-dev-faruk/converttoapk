import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CategoryKey } from '../services/StorageService';

interface CategoryTabsProps {
  selectedCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
}

interface TabItem {
  id: CategoryKey;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'all', label: 'সকল নোটিশ' },
  { id: 'education', label: 'পড়ালেখা' },
  { id: 'sports', label: 'খেলাধুলা' },
  { id: 'exams', label: 'পরীক্ষা' },
  { id: 'general', label: 'সাধারণ' },
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {TABS.map((tab) => {
        const isActive = selectedCategory === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onSelectCategory(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#ffffff',
  },
});
