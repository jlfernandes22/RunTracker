import React, { useCallback, useState } from 'react';
import { Text } from 'react-native-paper';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useDialog } from '../components/Dialog';
import { spacing, radii } from '../theme/tokens';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { SettingsGroup, ToggleRow } from '../components/Controls';
import { ReminderPicker } from '../components/ReminderPicker';
import { db } from '../db/database';
import { setSoundEnabled, setVibrationEnabled } from '../services/AudioCue';
import {
  DEFAULT_PREFS,
  NotificationPrefs,
  requestNotificationPermission,
  savePrefs,
} from '../services/notifications';

interface Feature {
  icon: AppIconName;
  title: string;
  text: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'directions-run',
    title: 'Record runs',
    text: 'GPS tracking with auto-pause, km markers, haptics and lock-screen stats.',
  },
  {
    icon: 'map',
    title: 'Plan routes',
    text: 'Tap waypoints on the map, save a route and run it anytime.',
  },
  {
    icon: 'history',
    title: 'Review progress',
    text: 'Weekly distance, streaks and pace improvements at a glance.',
  },
  {
    icon: 'cloud-off',
    title: '100% offline',
    text: 'No account, no cloud. All your runs stay on this device.',
  },
];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { palette } = useTheme();
  const dialog = useDialog();
  const [step, setStep] = useState(0);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [speech, setSpeech] = useState(true);
  const [autoPause, setAutoPause] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [busy, setBusy] = useState(false);

  const finish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await db.setSetting('run.soundCues', String(sound));
      await db.setSetting('run.vibration', String(vibration));
      await db.setSetting('run.speechCues', String(speech));
      await db.setSetting('run.autoPause', String(autoPause));
      setSoundEnabled(sound);
      setVibrationEnabled(vibration);
      if (reminders) {
        await requestNotificationPermission();
        const prefs: NotificationPrefs = { ...DEFAULT_PREFS, enabled: true, days, hour, minute };
        await savePrefs(prefs);
      }
      await db.setSetting('onboarding.completed', 'true');
      onDone();
    } catch (e) {
      console.warn('[onboarding] finish failed', e);
      dialog.alert({
        title: 'Something went wrong',
        message: 'Could not save your preferences. Please try again.',
        buttons: [{ label: 'OK' }],
      });
    } finally {
      setBusy(false);
    }
  }, [busy, sound, vibration, speech, autoPause, reminders, days, hour, minute, onDone, dialog]);

  const requestLocation = useCallback(async () => {
    try {
      const { requestForegroundPermissionsAsync } = require('expo-location');
      await requestForegroundPermissionsAsync();
    } catch {}
    await finish();
  }, [finish]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === step ? palette.primary : palette.surfaceContainerHighest,
                width: i === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <View style={styles.step}>
            <View style={[styles.logoCircle, { backgroundColor: palette.surfaceContainerHigh }]}>
              <AppIcon name="my-location" size={56} color={palette.primary} />
            </View>
            <Text variant="headlineMedium" style={{ color: palette.onSurface, textAlign: 'center', fontWeight: '700' }} maxFontSizeMultiplier={2}>
              Welcome to RunTracker
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: palette.onSurfaceVariant, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
              Your offline running companion. Let's get you set up in under a minute.
            </Text>
            <View style={styles.featureList}>
              {FEATURES.map((f) => (
                <Card key={f.title} variant="elevated" contentStyle={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: palette.primaryContainer }]}>
                    <AppIcon name={f.icon} size={22} color={palette.onPrimaryContainer} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="titleMedium" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2}>
                      {f.title}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
                      {f.text}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.step}>
            <Text variant="headlineSmall" style={{ color: palette.onSurface, textAlign: 'center', fontWeight: '700' }} maxFontSizeMultiplier={2}>
              Set your preferences
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: palette.onSurfaceVariant, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
              You can change all of these later in Settings.
            </Text>
            <SettingsGroup>
              <ToggleRow
                label="Sound cues"
                hint="Beeps for start, pause and each kilometer"
                value={sound}
                onValueChange={setSound}
              />
              <ToggleRow
                label="Vibration"
                hint="Haptic feedback for run events"
                value={vibration}
                onValueChange={setVibration}
              />
              <ToggleRow
                label="Spoken km markers"
                hint="Announces each kilometer during a run"
                value={speech}
                onValueChange={setSpeech}
              />
              <ToggleRow
                label="Auto-pause"
                hint="Pauses automatically when you stop moving"
                value={autoPause}
                onValueChange={setAutoPause}
              />
              <ToggleRow
                label="Run reminders"
                hint="Daily motivation notifications"
                value={reminders}
                onValueChange={setReminders}
              />
              {reminders ? (
                <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                  <ReminderPicker
                    days={days}
                    onDaysChange={setDays}
                    hour={hour}
                    minute={minute}
                    onTimeChange={(h, m) => {
                      setHour(h);
                      setMinute(m);
                    }}
                  />
                </View>
              ) : null}
            </SettingsGroup>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.step}>
            <View style={[styles.logoCircle, { backgroundColor: palette.surfaceContainerHigh }]}>
              <AppIcon name="gps-fixed" size={56} color={palette.primary} />
            </View>
            <Text variant="headlineSmall" style={{ color: palette.onSurface, textAlign: 'center', fontWeight: '700' }} maxFontSizeMultiplier={2}>
              Location access
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: palette.onSurfaceVariant, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
              To record your runs and show your position on the map, RunTracker needs location permission. It is never shared — everything stays on your device.
            </Text>
            <Card variant="filled" contentStyle={styles.privacyCard}>
              <AppIcon name="lock" size={20} color={palette.primary} />
              <Text variant="bodyMedium" style={{ color: palette.onSurface, flex: 1, fontWeight: '500' }} maxFontSizeMultiplier={2}>
                Location data is used only while you run and is stored locally.
              </Text>
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step === 0 ? (
          <BigButton label="Get started" onPress={() => setStep(1)} size="large" style={{ width: '100%' }} />
        ) : null}
        {step === 1 ? (
          <View style={styles.footerRow}>
            <BigButton label="Back" onPress={() => setStep(0)} variant="secondary" style={{ flex: 1 }} />
            <BigButton label="Continue" onPress={() => setStep(2)} size="large" style={{ flex: 2 }} />
          </View>
        ) : null}
        {step === 2 ? (
          <View style={styles.footerRow}>
            <BigButton label="Skip" onPress={finish} variant="ghost" disabled={busy} style={{ flex: 1 }} />
            <BigButton label="Allow location" onPress={requestLocation} size="large" disabled={busy} style={{ flex: 2 }} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  step: {
    gap: spacing.lg,
  },
  logoCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  subtitle: {
    marginBottom: spacing.sm,
  },
  featureList: {
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
