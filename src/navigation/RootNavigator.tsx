import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { typeScale } from '../theme/tokens';
import { RunScreen } from '../screens/RunScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { MapPlannerScreen } from '../screens/MapPlannerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RunDetailScreen } from '../screens/RunDetailScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type RootTabParamList = {
  Run: { routeId?: string } | undefined;
  History: undefined;
  Plan: undefined;
  Settings: undefined;
};

export type HistoryStackParamList = {
  HistoryList: undefined;
  RunDetail: { runId: string };
};

export type PlanStackParamList = {
  PlanList: undefined;
  MapPlanner: undefined;
  RouteDetail: { routeId: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const PlanStack = createNativeStackNavigator<PlanStackParamList>();

const TABS: Record<keyof RootTabParamList, { icon: AppIconName; label: string }> = {
  Run: { icon: 'directions-run', label: 'Run' },
  History: { icon: 'history', label: 'History' },
  Plan: { icon: 'map', label: 'Plan' },
  Settings: { icon: 'settings', label: 'Settings' },
};

function tabIcon(tab: keyof RootTabParamList, focused: boolean, color: string) {
  const t = TABS[tab];
  return <AppIcon name={t.icon} size={focused ? 26 : 24} color={color} />;
}

function HistoryNavigator() {
  const { palette } = useTheme();
  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <HistoryStack.Screen name="HistoryList" component={HistoryScreen} options={{ headerShown: false }} />
      <HistoryStack.Screen name="RunDetail" component={RunDetailScreen} options={{ title: 'Run details' }} />
    </HistoryStack.Navigator>
  );
}

function PlanNavigator() {
  const { palette } = useTheme();
  return (
    <PlanStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <PlanStack.Screen name="PlanList" component={PlanScreen} options={{ headerShown: false }} />
      <PlanStack.Screen name="MapPlanner" component={MapPlannerScreen} options={{ title: 'Plan a route', headerBackButtonDisplayMode: 'minimal' }} />
      <PlanStack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ title: 'Route details' }} />
    </PlanStack.Navigator>
  );
}

export function RootNavigator() {
  const { palette } = useTheme();
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        dark: true,
        colors: {
          primary: palette.primary,
          background: palette.background,
          card: palette.surface,
          text: palette.text,
          border: palette.border,
          notification: palette.danger,
        },
      }}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textMuted,
          tabBarLabelStyle: { fontSize: typeScale.labelSmall.fontSize, fontWeight: '600', letterSpacing: 0.3 },
        }}
      >
        <Tab.Screen
          name="Run"
          component={RunScreen}
          options={{ tabBarIcon: ({ focused, color }) => tabIcon('Run', focused, color), tabBarAccessibilityLabel: 'Run' }}
        />
        <Tab.Screen
          name="History"
          component={HistoryNavigator}
          options={{ tabBarIcon: ({ focused, color }) => tabIcon('History', focused, color), tabBarAccessibilityLabel: 'Run history' }}
        />
        <Tab.Screen
          name="Plan"
          component={PlanNavigator}
          options={{ tabBarIcon: ({ focused, color }) => tabIcon('Plan', focused, color), tabBarAccessibilityLabel: 'Route planner' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarIcon: ({ focused, color }) => tabIcon('Settings', focused, color), tabBarAccessibilityLabel: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
