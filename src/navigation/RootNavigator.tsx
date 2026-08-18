import React, { useEffect } from 'react';
import { Easing as AnimatedEasing, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Duration, Spring, toReanimatedSpring, radii, spacing, typeScale } from '../theme/tokens';
import { createBottomTabNavigator, TransitionPresets } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { Text } from 'react-native-paper';
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

const AnimatedPressable = createAnimatedComponent(Pressable);

/**
 * Material Design 3 Navigation Bar Item.
 * Features:
 * - 64x32dp active indicator pill in secondaryContainer
 * - Icon tinting in onSecondaryContainer (focused) vs onSurfaceVariant (idle)
 * - Label in onSurface (focused) vs onSurfaceVariant (idle)
 * - Spring animation on selection (spatialFast)
 */
function MD3TabBarItem({
  tabKey,
  focused,
  onPress,
  onLongPress,
  accessibilityLabel,
}: {
  tabKey: keyof RootTabParamList;
  focused: boolean;
  onPress?: ((e: any) => void) | null;
  onLongPress?: ((e: any) => void) | null;
  accessibilityLabel?: string;
}) {
  const { palette, settings } = useTheme();
  const tabInfo = TABS[tabKey];

  const pillScale = useSharedValue(focused ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    if (settings.reduceMotion) {
      pillScale.value = focused ? 1 : 0;
      return;
    }
    pillScale.value = withSpring(focused ? 1 : 0, toReanimatedSpring(Spring.spatialFast));
  }, [focused, settings.reduceMotion, pillScale]);

  const onPressIn = () => {
    if (settings.reduceMotion) return;
    pressScale.value = withSpring(0.92, toReanimatedSpring(Spring.spatialFast));
  };

  const onPressOut = () => {
    if (settings.reduceMotion) return;
    pressScale.value = withSpring(1, toReanimatedSpring(Spring.spatialFast));
  };

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: pillScale.value }, { scaleY: Math.max(0.6, pillScale.value) }],
    opacity: pillScale.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconColor = focused ? palette.onSecondaryContainer : palette.onSurfaceVariant;
  const labelColor = focused ? palette.onSurface : palette.onSurfaceVariant;

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? tabInfo.label}
      android_ripple={{ color: 'transparent' }}
      style={[styles.tabItem, containerAnimatedStyle]}
    >
      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.activeIndicator,
            { backgroundColor: palette.secondaryContainer },
            pillAnimatedStyle,
          ]}
        />
        <AppIcon name={tabInfo.icon} size={24} color={iconColor} />
      </View>
      <Text
        variant="labelMedium"
        style={[
          styles.tabLabel,
          {
            color: labelColor,
            fontWeight: focused ? '700' : '500',
          },
        ]}
        maxFontSizeMultiplier={1.5}
      >
        {tabInfo.label}
      </Text>
    </AnimatedPressable>
  );
}

function HistoryNavigator() {
  const { palette } = useTheme();
  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.onSurface,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
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
        headerTintColor: palette.onSurface,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <PlanStack.Screen name="PlanList" component={PlanScreen} options={{ headerShown: false }} />
      <PlanStack.Screen
        name="MapPlanner"
        component={MapPlannerScreen}
        options={{ title: 'Plan a route', headerBackButtonDisplayMode: 'minimal' }}
      />
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
          card: palette.surfaceContainer,
          text: palette.onSurface,
          border: palette.outlineVariant,
          notification: palette.error,
        },
      }}
    >
      <Tab.Navigator
        screenOptions={{
          lazy: false,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: palette.surfaceContainer,
            borderTopColor: palette.outlineVariant,
            borderTopWidth: 1,
            height: 80,
            paddingTop: 8,
            paddingBottom: 12,
          },
          // MD3 nav-tab cross-fade transition. Disabled with reduce-motion.
          ...(settings.reduceMotion ? {} : TransitionPresets.FadeTransition),
        }}
      >
        <Tab.Screen
          name="Run"
          component={RunScreen}
          options={{
            tabBarButton: (props) => (
              <MD3TabBarItem
                tabKey="Run"
                focused={props.accessibilityState?.selected ?? false}
                onPress={props.onPress}
                onLongPress={props.onLongPress}
                accessibilityLabel="Run"
              />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryNavigator}
          options={{
            tabBarButton: (props) => (
              <MD3TabBarItem
                tabKey="History"
                focused={props.accessibilityState?.selected ?? false}
                onPress={props.onPress}
                onLongPress={props.onLongPress}
                accessibilityLabel="Run history"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Plan"
          component={PlanNavigator}
          options={{
            tabBarButton: (props) => (
              <MD3TabBarItem
                tabKey="Plan"
                focused={props.accessibilityState?.selected ?? false}
                onPress={props.onPress}
                onLongPress={props.onLongPress}
                accessibilityLabel="Route planner"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarButton: (props) => (
              <MD3TabBarItem
                tabKey="Settings"
                focused={props.accessibilityState?.selected ?? false}
                onPress={props.onPress}
                onLongPress={props.onLongPress}
                accessibilityLabel="Settings"
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  iconContainer: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    width: 64,
    height: 32,
    borderRadius: radii.large,
  },
  tabLabel: {
    letterSpacing: 0.2,
  },
});
