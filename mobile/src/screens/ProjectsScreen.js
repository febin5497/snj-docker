import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { COLORS, SPACING, CARD, INPUT } from '../styles/theme';
import api from '../api/api';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/api/projects/');
      const data = res.data?.data || res.data;
      setProjects(data?.items || data?.projects || (Array.isArray(data) ? data : []));
    } catch (e) { console.log(e.message); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = projects.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s) => {
    if (s === 'completed' || s === 'done') return COLORS.accent;
    if (s === 'in_progress' || s === 'active') return COLORS.primary;
    if (s === 'on_hold') return COLORS.warning;
    return COLORS.textMuted;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={CARD} onPress={() => {}}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.location || item.site_name || 'No location'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '22' }]}>
          <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status || 'Active'}</Text>
        </View>
      </View>
      {item.budget && <Text style={styles.budget}>Budget: ${(item.budget || 0).toLocaleString()}</Text>}
      {item.progress != null && (
        <View style={styles.progressRow}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(item.progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <Text style={styles.count}>{filtered.length} projects</Text>
      </View>
      <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
        <TextInput style={[INPUT, { marginBottom: 0 }]} placeholder="Search projects..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
      </View>
      <FlatList data={filtered} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} ItemSeparatorComponent={() => <View style={{ height: 8 }} />} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProjects(); }} tintColor={COLORS.primary} />} ListEmptyComponent={!loading ? <View style={styles.empty}><Text style={styles.emptyText}>No projects found</Text></View> : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  count: { fontSize: 13, color: COLORS.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  budget: { fontSize: 13, color: COLORS.primary, marginTop: 8, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  progressText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', width: 36, textAlign: 'right' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
});
