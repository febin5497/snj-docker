import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { COLORS, SPACING, CARD } from '../styles/theme';
import api from '../api/api';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await api.get('/api/expenses/?limit=50');
      const data = res.data?.data || res.data;
      setExpenses(data?.items || data?.expenses || (Array.isArray(data) ? data : []));
    } catch (e) { console.log(e.message); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const categoryIcon = (cat) => {
    const icons = { salary: '💰', material: '🧱', fuel: '⛽', equipment: '🔧', maintenance: '🛠', food: '🍽', transport: '🚛', other: '📦' };
    return icons[(cat || '').toLowerCase()] || '📦';
  };

  const renderItem = ({ item }) => (
    <View style={CARD}>
      <View style={styles.row}>
        <Text style={styles.icon}>{categoryIcon(item.category)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.desc}>{item.description || item.category || 'Expense'}</Text>
          <Text style={styles.meta}>{item.date || ''} {item.project_name ? `• ${item.project_name}` : ''}</Text>
        </View>
        <Text style={styles.amount}>${(item.amount || 0).toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <Text style={styles.count}>{expenses.length} records</Text>
      </View>
      <View style={[CARD, styles.totalCard]}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalAmount}>${totalAmount.toLocaleString()}</Text>
      </View>
      <FlatList data={expenses} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} ItemSeparatorComponent={() => <View style={{ height: 8 }} />} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(); }} tintColor={COLORS.primary} />} ListEmptyComponent={!loading ? <View style={styles.empty}><Text style={styles.emptyText}>No expenses found</Text></View> : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  count: { fontSize: 13, color: COLORS.textSecondary },
  totalCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, alignItems: 'center', backgroundColor: 'rgba(74,144,217,0.1)', borderColor: COLORS.primary },
  totalLabel: { fontSize: 13, color: COLORS.textSecondary },
  totalAmount: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 28 },
  desc: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: COLORS.danger },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
});
