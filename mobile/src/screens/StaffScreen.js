import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TextInput, Image } from 'react-native';
import { COLORS, SPACING, CARD, INPUT } from '../styles/theme';
import api from '../api/api';

export default function StaffScreen() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/api/staff/');
      const data = res.data?.data || res.data;
      setStaff(data?.items || data?.staff || (Array.isArray(data) ? data : []));
    } catch (e) { console.log(e.message); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const filtered = staff.filter((s) => (s.full_name || s.name || s.username || '').toLowerCase().includes(search.toLowerCase()));

  const getInitials = (name) => (name || 'U').split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();

  const renderItem = ({ item }) => {
    const name = item.full_name || item.name || item.username || 'Unknown';
    const colors = ['#4a90d9', '#00c864', '#ffd93d', '#ff6b6b', '#c084fc'];
    const bgColor = colors[name.charCodeAt(0) % colors.length];
    return (
      <View style={CARD}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: bgColor }]}>
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{item.role || item.designation || item.department || 'Staff'}</Text>
            {item.username && <Text style={styles.username}>@{item.username}</Text>}
          </View>
          {item.phone && <Text style={styles.phone}>{item.phone}</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff</Text>
        <Text style={styles.count}>{filtered.length} members</Text>
      </View>
      <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
        <TextInput style={[INPUT, { marginBottom: 0 }]} placeholder="Search staff..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
      </View>
      <FlatList data={filtered} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} ItemSeparatorComponent={() => <View style={{ height: 8 }} />} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStaff(); }} tintColor={COLORS.primary} />} ListEmptyComponent={!loading ? <View style={styles.empty}><Text style={styles.emptyText}>No staff found</Text></View> : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  count: { fontSize: 13, color: COLORS.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  role: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  username: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  phone: { fontSize: 12, color: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
});
