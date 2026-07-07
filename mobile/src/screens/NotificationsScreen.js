import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { COLORS, SPACING, CARD } from '../styles/theme';
import api from '../api/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/?limit=50');
      const data = res.data?.data || res.data;
      setNotifications(data?.items || data?.notifications || (Array.isArray(data) ? data : []));
    } catch (e) { console.log(e.message); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const typeIcon = (t) => {
    const icons = { info: 'ℹ️', warning: '⚠️', success: '✅', alert: '🚨', attendance: '📋', payment: '💰' };
    return icons[(t || '').toLowerCase()] || '🔔';
  };

  const renderItem = ({ item }) => (
    <View style={[CARD, !item.is_read && styles.unread]}>
      <View style={styles.row}>
        <Text style={styles.icon}>{typeIcon(item.type)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title || item.message || 'Notification'}</Text>
          <Text style={styles.message} numberOfLines={2}>{item.message || item.body || ''}</Text>
          <Text style={styles.time}>{item.created_at || item.date || ''}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.count}>{notifications.filter((n) => !n.is_read).length} unread</Text>
      </View>
      <FlatList data={notifications} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} ItemSeparatorComponent={() => <View style={{ height: 8 }} />} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={COLORS.primary} />} ListEmptyComponent={!loading ? <View style={styles.empty}><Text style={styles.emptyText}>No notifications</Text></View> : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  count: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  row: { flexDirection: 'row', gap: 12 },
  icon: { fontSize: 24 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  message: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
});
