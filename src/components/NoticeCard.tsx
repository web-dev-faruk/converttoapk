import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NoticeItem } from '../services/StorageService';

interface NoticeCardProps {
  notice: NoticeItem;
  onOpenPdf: () => void;
  onDelete: () => void;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({
  notice,
  onOpenPdf,
  onDelete,
}) => {
  const formattedDate = new Date(notice.timestamp).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      {/* Top Metadata Row: Zero-pill clean typographic separator */}
      <View style={styles.metaRow}>
        <Text style={styles.categoryText}>{notice.category}</Text>
        <Text style={styles.dotSeparator}>·</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
        {notice.fileSize && (
          <>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.fileSizeText}>{notice.fileSize}</Text>
          </>
        )}
      </View>

      {/* Notice Title */}
      <Text style={styles.title} numberOfLines={3}>
        {notice.title}
      </Text>

      {/* Description if present */}
      {notice.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {notice.description}
        </Text>
      ) : null}

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        {/* Open PDF / Attachment Button */}
        {notice.pdfUrl ? (
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={onOpenPdf}
            activeOpacity={0.7}
          >
            <Text style={styles.pdfButtonIcon}>📄</Text>
            <Text style={styles.pdfButtonText}>পিডিএফ দেখুন / ডাউনলোড</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noPdfNotice}>
            <Text style={styles.noPdfText}>সংযুক্তি নেই</Text>
          </View>
        )}

        {/* Delete Individual Notice Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
          <Text style={styles.deleteText}>মুছুন</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
  },
  dotSeparator: {
    color: '#64748b',
    marginHorizontal: 6,
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  fileSizeText: {
    fontSize: 12,
    color: '#64748b',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pdfButtonIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  pdfButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  noPdfNotice: {
    paddingVertical: 6,
  },
  noPdfText: {
    fontSize: 12,
    color: '#64748b',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  deleteIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  deleteText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
});
