import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, CARD } from '../styles/theme';

const SettingItem = ({ icon, label, value, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Text style={styles.itemIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.itemLabel}>{label}</Text>
      {value && <Text style={styles.itemValue}>{value}</Text>}
    </View>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
);

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenTitle}>Settings</Text>

      {/* Profile Card */}
      <View style={[CARD, styles.profileCard]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.username || 'U')[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.full_name || user?.username || 'User'}</Text>
          <Text style={styles.profileRole}>{user?.role || user?.designation || 'Staff'}</Text>
          <Text style={styles.profileId}>ID: {user?.username || user?.staff_id || '--'}</Text>
        </View>
      </View>

      {/* Account */}
      <Text style={styles.section}>Account</Text>
      <View style={CARD}>
        <SettingItem icon="🔑" label="Change Password" onPress={() => navigation.navigate('PasswordChange')} />
        <SettingItem icon="👤" label="Profile" value={user?.full_name || user?.username} onPress={() => {}} />
      </View>

      {/* App */}
      <Text style={styles.section}>App</Text>
      <View style={CARD}>
        <SettingItem icon="📱" label="Version" value="1.0.0" onPress={() => {}} />
        <SettingItem icon="🌐" label="Server" value="AWS EC2" onPress={() => {}} />
      </View>

      {/* Danger Zone */}
      <Text style={styles.section}>Session</Text>
      <TouchableOpacity style={[CARD, styles.logoutBtn]} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  screenTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, padding: SPACING.lg, paddingBottom: SPACING.sm },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: SPACING.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  profileRole: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  profileId: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  section: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  itemIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  itemLabel: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  itemValue: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  arrow: { fontSize: 20, color: COLORS.textMuted },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: SPACING.lg, borderColor: COLORS.danger },
  logoutIcon: { fontSize: 20 },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.danger },
});
