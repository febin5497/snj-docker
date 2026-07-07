import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, CARD, INPUT, BTN } from '../styles/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Enter username and password');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🏗</Text>
          <Text style={styles.logoTitle}>SNJ Construction</Text>
          <Text style={styles.logoSub}>ERP Management System</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={INPUT} placeholder="Enter username" placeholderTextColor={COLORS.textMuted} value={username} onChangeText={setUsername} autoCapitalize="none" />

          <Text style={[styles.label, { marginTop: SPACING.md }]}>Password</Text>
          <TextInput style={INPUT} placeholder="Enter password" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={[BTN.primary, { marginTop: SPACING.lg }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Default password: Erp@123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flex: 1, justifyContent: 'center', padding: SPACING.lg },
  logoBox: { alignItems: 'center', marginBottom: SPACING.xl },
  logoIcon: { fontSize: 64 },
  logoTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: SPACING.sm },
  logoSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  form: { ...CARD, padding: SPACING.lg },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.lg },
});
