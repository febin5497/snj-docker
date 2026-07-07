import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, CARD, INPUT, BTN } from '../styles/theme';

export default function PasswordChangeScreen({ navigation }) {
  const { changePassword, logout } = useAuth();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!oldPass || !newPass) { Alert.alert('Error', 'Fill all fields'); return; }
    if (newPass !== confirmPass) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (newPass.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await changePassword(oldPass, newPass);
      Alert.alert('Success', 'Password changed. Please login again.', [{ text: 'OK', onPress: () => logout() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>Update your default password</Text>

        <Text style={styles.label}>Current Password</Text>
        <TextInput style={INPUT} placeholder="Enter current password" placeholderTextColor={COLORS.textMuted} value={oldPass} onChangeText={setOldPass} secureTextEntry />

        <Text style={[styles.label, { marginTop: SPACING.md }]}>New Password</Text>
        <TextInput style={INPUT} placeholder="Enter new password" placeholderTextColor={COLORS.textMuted} value={newPass} onChangeText={setNewPass} secureTextEntry />

        <Text style={[styles.label, { marginTop: SPACING.md }]}>Confirm New Password</Text>
        <TextInput style={INPUT} placeholder="Confirm new password" placeholderTextColor={COLORS.textMuted} value={confirmPass} onChangeText={setConfirmPass} secureTextEntry />

        <TouchableOpacity style={[BTN.primary, { marginTop: SPACING.lg }]} onPress={handleChange} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Password</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={BTN.ghost} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', padding: SPACING.lg },
  card: CARD,
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});
