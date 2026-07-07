import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, CARD } from '../styles/theme';
import api from '../api/api';

const StatCard = ({ icon, label, value, color }) => (
  <View style={[statStyles.card, { borderLeftColor: color || COLORS.primary }]}>
    <Text style={statStyles.icon}>{icon}</Text>
    <Text style={statStyles.value}>{value ?? '--'}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity style={quickStyles.btn} onPress={onPress}>
    <Text style={quickStyles.icon}>{icon}</Text>
    <Text style={quickStyles.label}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, staffRes, attendanceRes, expenseRes] = await Promise.allSettled([
        api.get('/api/projects/'),
        api.get('/api/staff/'),
        api.get('/api/attendance/today'),
        api.get('/api/expenses/?limit=5'),
      ]);
      const p = projectsRes.status === 'fulfilled' ? projectsRes.value.data?.data : null;
      const s = staffRes.status === 'fulfilled' ? staffRes.value.data?.data : null;
      const a = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data?.data : null;
      const e = expenseRes.status === 'fulfilled' ? expenseRes.value.data?.data : null;
      setStats({
        projects: p?.total ?? p?.items?.length ?? 0,
        staff: s?.total ?? s?.items?.length ?? 0,
        attendance: a?.total ?? a?.items?.length ?? 0,
        expenses: e?.total ?? e?.items?.length ?? 0,
      });
      const acts = [];
      if (a?.items) a.items.slice(0, 5).forEach((att) => acts.push({ id: att.id, text: `${att.staff_name || 'Staff'} - ${att.status}`, time: att.date, icon: '📋' }));
      if (e?.items) e.items.slice(0, 5).forEach((ex) => acts.push({ id: ex.id, text: ex.description || ex.category, time: ex.date, icon: '💰' }));
      setRecentActivity(acts.slice(0, 8));
    } catch (err) { console.log('Dashboard fetch error:', err.message); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.userName}>{user?.full_name || user?.username || 'User'}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.username || 'U')[0].toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard icon="📁" label="Projects" value={stats.projects} color={COLORS.primary} />
        <StatCard icon="👥" label="Staff" value={stats.staff} color={COLORS.accent} />
        <StatCard icon="📋" label="Today" value={stats.attendance} color={COLORS.warning} />
        <StatCard icon="💰" label="Expenses" value={stats.expenses} color={COLORS.danger} />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <QuickAction icon="📸" label="Attendance" onPress={() => navigation.navigate('Attendance')} />
        <QuickAction icon="📁" label="Projects" onPress={() => navigation.navigate('Projects')} />
        <QuickAction icon="👥" label="Staff" onPress={() => navigation.navigate('Staff')} />
        <QuickAction icon="💰" label="Expenses" onPress={() => navigation.navigate('Expenses')} />
        <QuickAction icon="🔔" label="Notices" onPress={() => navigation.navigate('Notifications')} />
        <QuickAction icon="⚙" label="Settings" onPress={() => navigation.navigate('Settings')} />
      </View>

      {recentActivity.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={CARD}>
            {recentActivity.map((act, i) => (
              <View key={act.id || i} style={[styles.activityRow, i < recentActivity.length - 1 && styles.activityBorder]}>
                <Text style={styles.activityIcon}>{act.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText} numberOfLines={1}>{act.text}</Text>
                  <Text style={styles.activityTime}>{act.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.md },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  userName: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  activityIcon: { fontSize: 20 },
  activityText: { fontSize: 14, color: COLORS.text },
  activityTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});

const statStyles = StyleSheet.create({
  card: { ...CARD, width: '48%', marginBottom: 0, borderLeftWidth: 3, paddingLeft: 14 },
  icon: { fontSize: 24, marginBottom: 6 },
  value: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  label: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});

const quickStyles = StyleSheet.create({
  btn: { width: '31%', aspectRatio: 1, ...CARD, justifyContent: 'center', alignItems: 'center', marginBottom: 0 },
  icon: { fontSize: 28, marginBottom: 6 },
  label: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
});
