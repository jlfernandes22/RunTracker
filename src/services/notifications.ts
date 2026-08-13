import * as Notifications from 'expo-notifications';
import { db } from '../db/database';

const CHANNEL_MOTIVATION = 'motivation';

// Required: tells expo-notifications how to handle notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface NotificationPrefs {
  enabled: boolean;
  days: number[]; // 0=Sunday .. 6=Saturday
  hour: number;
  minute: number;
  restReminders: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  days: [1, 3, 5], // Mon, Wed, Fri
  hour: 7,
  minute: 0,
  restReminders: true,
};

const MESSAGES = [
  'Ready for your run? Lace up!',
  'Time to move! Your legs will thank you.',
  'A quick run is better than no run. Go!',
  'Fresh air and a few kilometers await you.',
  'Make today count. Get out there!',
];

const REST_MESSAGES = [
  'Rest day. Your body is recovering.',
  'No run today. Recovery is part of training.',
  'Well done this week. Rest up for the next one.',
];

export async function setupChannels() {
  await Notifications.setNotificationChannelAsync(CHANNEL_MOTIVATION, {
    name: 'Run reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
  // The run-stats channel is created natively by RunStatsNotifier with
  // DEFAULT importance + PUBLIC visibility (expo cannot set per-notification
  // visibility and would otherwise create the channel with LOW importance,
  // which is not shown on the lock screen).
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.requestPermissionsAsync();
  return settings.status === 'granted';
}

export async function loadPrefs(): Promise<NotificationPrefs> {
  const raw = await db.getSetting('notifications.prefs');
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(prefs: NotificationPrefs): Promise<void> {
  await db.setSetting('notifications.prefs', JSON.stringify(prefs));
  await scheduleFromPrefs(prefs);
}

export async function scheduleFromPrefs(prefs: NotificationPrefs) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.enabled) return;

  const hour = Math.max(0, Math.min(23, prefs.hour));
  const minute = Math.max(0, Math.min(59, prefs.minute));

  for (let day = 0; day < 7; day++) {
    const isRunDay = prefs.days.includes(day);
    // Rest-day nudges fire on days the user does not run (only when enabled).
    if (!isRunDay && !prefs.restReminders) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isRunDay ? 'Run day' : 'Rest day',
        body: pick(isRunDay ? MESSAGES : REST_MESSAGES),
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        channelId: CHANNEL_MOTIVATION,
        weekday: day + 1, // expo: 1 = Sunday
        hour,
        minute,
      },
    });
  }
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function showRunStatsNotification(text: string) {
  // Posted natively so the lock screen shows the stats (expo-notifications
  // cannot set per-notification visibility, which defaults to PRIVATE).
  const { NativeModules } = require('react-native');
  await NativeModules.RunStatsNotifier?.show(text);
}

export async function hideRunStatsNotification() {
  const { NativeModules } = require('react-native');
  await NativeModules.RunStatsNotifier?.hide();
}
