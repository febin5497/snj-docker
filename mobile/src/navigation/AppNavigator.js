import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../styles/theme';

import LoginScreen from '../screens/LoginScreen';
import PasswordChangeScreen from '../screens/PasswordChangeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import StaffScreen from '../screens/StaffScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ icon, label, focused }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
    <Text style={{ fontSize: 10, color: focused ? COLORS.primary : COLORS.textMuted, fontWeight: focused ? '700' : '500', marginTop: 2 }}>{label}</Text>
  </View>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.cardBorder, height: 65, paddingBottom: 8 },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📸" label="Attendance" focused={focused} /> }} />
      <Tab.Screen name="Projects" component={ProjectsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📁" label="Projects" focused={focused} /> }} />
      <Tab.Screen name="Staff" component={StaffScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="Staff" focused={focused} /> }} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="Expenses" focused={focused} /> }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Notices" focused={focused} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙" label="Settings" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48 }}>🏗</Text>
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 16 }}>SNJ Construction</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
