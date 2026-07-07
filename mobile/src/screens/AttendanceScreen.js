import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, CARD, BTN } from '../styles/theme';
import api from '../api/api';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchToday();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (todayRecord?.check_in && !todayRecord?.check_out) {
      const start = new Date(todayRecord.check_in).getTime();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [todayRecord]);

  const fetchToday = async () => {
    try {
      const res = await api.get('/api/attendance/today');
      const data = res.data?.data;
      const items = data?.items || data?.records || [];
      const myRecord = items.find((r) => r.staff_id === user?.staff_id || r.user_id === user?.id);
      if (myRecord) setTodayRecord(myRecord);
    } catch (e) { console.log(e.message); }
    setLoading(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission', 'Camera permission needed'); return null; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    if (result.canceled) return null;
    return result.assets[0];
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({});
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  };

  const handlePunchIn = async () => {
    setPunching(true);
    try {
      const cam = await takePhoto();
      const loc = await getLocation();
      const formData = new FormData();
      formData.append('date', new Date().toISOString().split('T')[0]);
      formData.append('check_in', new Date().toISOString());
      formData.append('status', 'present');
      if (cam) {
        formData.append('photo', { uri: cam.uri, type: 'image/jpeg', name: 'attendance.jpg' });
      }
      if (loc) {
        formData.append('latitude', String(loc.latitude));
        formData.append('longitude', String(loc.longitude));
      }
      const res = await api.post('/api/attendance/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTodayRecord(res.data?.data || res.data);
      Alert.alert('Success', 'Punched in!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to punch in');
    }
    setPunching(false);
  };

  const handlePunchOut = async () => {
    setPunching(true);
    try {
      const cam = await takePhoto();
      const loc = await getLocation();
      const id = todayRecord?.id;
      const body = { check_out: new Date().toISOString() };
      if (cam) body.photo_out = cam.base64;
      if (loc) { body.latitude_out = loc.latitude; body.longitude_out = loc.longitude; }
      const res = await api.patch(`/api/attendance/${id}`, body);
      setTodayRecord(res.data?.data || res.data);
      Alert.alert('Success', 'Punched out!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to punch out');
    }
    setPunching(false);
  };

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const isCheckedIn = todayRecord?.check_in && !todayRecord?.check_out;
  const isCheckedOut = todayRecord?.check_in && todayRecord?.check_out;

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Timer Card */}
      <View style={[CARD, styles.timerCard]}>
        <Text style={styles.timerLabel}>Elapsed Time</Text>
        <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
        {todayRecord?.check_in && (
          <Text style={styles.checkInTime}>
            Check-in: {new Date(todayRecord.check_in).toLocaleTimeString()}
          </Text>
        )}
        {isCheckedOut && (
          <Text style={styles.checkOutTime}>
            Check-out: {new Date(todayRecord.check_out).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Status */}
      <View style={[CARD, { alignItems: 'center', paddingVertical: SPACING.lg }]}>
        <Text style={[styles.statusDot, { color: isCheckedIn ? COLORS.accent : isCheckedOut ? COLORS.textMuted : COLORS.warning }]}>●</Text>
        <Text style={styles.statusText}>
          {isCheckedOut ? 'Completed' : isCheckedIn ? 'Checked In' : 'Not Checked In'}
        </Text>
      </View>

      {/* Punch Buttons */}
      <View style={styles.punchRow}>
        {!isCheckedIn && !isCheckedOut && (
          <TouchableOpacity style={[BTN.primary, styles.punchBtn]} onPress={handlePunchIn} disabled={punching}>
            {punching ? <ActivityIndicator color="#fff" /> : <Text style={styles.punchBtnText}>📸 Punch In</Text>}
          </TouchableOpacity>
        )}
        {isCheckedIn && (
          <TouchableOpacity style={[BTN.danger, styles.punchBtn]} onPress={handlePunchOut} disabled={punching}>
            {punching ? <ActivityIndicator color="#fff" /> : <Text style={styles.punchBtnText}>📸 Punch Out</Text>}
          </TouchableOpacity>
        )}
        {isCheckedOut && (
          <View style={styles.completedBox}>
            <Text style={styles.completedText}>✓ Today's attendance completed</Text>
          </View>
        )}
      </View>

      {/* Weekly Summary */}
      <Text style={styles.sectionTitle}>This Week</Text>
      <View style={styles.weekRow}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
          const today = new Date().getDay();
          const isToday = i + 1 === today;
          const isPast = i + 1 < today;
          return (
            <View key={i} style={[styles.dayBox, isToday && styles.dayBoxActive, isPast && !todayRecord && styles.dayBoxMissed]}>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>{d}</Text>
              {isPast && <Text style={styles.dayStatus}>{todayRecord ? '✓' : '—'}</Text>}
              {isToday && <Text style={styles.dayStatus}>{isCheckedIn ? '✓' : '○'}</Text>}
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.lg, paddingBottom: SPACING.md },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  timerCard: { alignItems: 'center', paddingVertical: SPACING.xl },
  timerLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  timer: { fontSize: 48, fontWeight: '800', color: COLORS.primary, fontVariant: ['tabular-nums'] },
  checkInTime: { fontSize: 13, color: COLORS.accent, marginTop: SPACING.sm },
  checkOutTime: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  statusDot: { fontSize: 32 },
  statusText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  punchRow: { padding: SPACING.lg },
  punchBtn: { paddingVertical: 18 },
  punchBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  completedBox: { ...CARD, width: '100%', alignItems: 'center', backgroundColor: 'rgba(0,200,100,0.1)', borderColor: COLORS.accent },
  completedText: { color: COLORS.accent, fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: SPACING.lg },
  dayBox: { ...CARD, width: 42, height: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 0 },
  dayBoxActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(74,144,217,0.15)' },
  dayBoxMissed: { borderColor: COLORS.danger, backgroundColor: 'rgba(255,68,68,0.08)' },
  dayLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  dayLabelActive: { color: COLORS.primary },
  dayStatus: { fontSize: 14, marginTop: 2, color: COLORS.text },
});
