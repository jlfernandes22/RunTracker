import React, { useEffect } from 'react';
import { Easing as AnimatedEasing, Pressable } from 'react-native';
import Animated, {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Duration, Spring, toReanimatedSpring } from '../theme/tokens';
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

/**
 * Tab icon with a spring pop on selection (spatialFast, MD3 press scale),
 * gated by reduce-motion. The icon scales 1.0 when active, 0.82 when idle.
 */
function TabIcon({ icon, focused, color }: { icon: AppIconName; focused: boolean; color: string }) {
  const { settings } = useTheme();
  const scale = useSharedValue(focused ? 1 : 0.82);

  useEffect(() => {
    if (settings.reduceMotion) {
      scale.value = focused ? 1 : 0.82;
      return;
    }
    scale.value = withSpring(focused ? 1 : 0.82, toReanimatedSpring(Spring.spatialFast));
  }, [focused, settings.reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AppIcon name={icon} size={26} color={color} />
    </Animated.View>
  );
}

const AnimatedTabButton = createAnimatedComponent(Pressable);

/**
 * Tab button without the default grey ripple; the whole button squashes
 * slightly on press and springs back (MD3 spatialFast).
 */
function TabBarButton(props: any) {
  const { settings } = useTheme();
  const scale = useSharedValue(1);

  const pressIn = () => {
    if (settings.reduceMotion) return;
    scale.value = withSpring(0.9, toReanimatedSpring(Spring.spatialFast));
  };
  const pressOut = () => {
    if (settings.reduceMotion) return;
    scale.value = withSpring(1, toReanimatedSpring(Spring.spatialFast));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const { onPress, onLongPress, children, style, ...rest } = props;
  return (
    <AnimatedTabButton
      {...rest}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      android_ripple={{ color: 'transparent' }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedTabButton>
  );
}

function tabIcon(tab: keyof RootTabParamList, focused: boolean, color: string) {
  const t = TABS[tab];
  return <TabIcon icon={t.icon} focused={focused} color={color} />;
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
  const { palette, settings } = useTheme();
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
          tabBarButton: (props) => <TabBarButton {...props} />,
          // MD3 nav-tab motion: standard easing, short4 (200ms). Disabled with reduce-motion.
          animation: settings.reduceMotion ? 'none' : 'shift',
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: Duration.short4,
              easing: AnimatedEasing.bezier(0.2, 0, 0, 1),
            },
          },
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
