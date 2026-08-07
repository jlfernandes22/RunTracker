import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radii } from '../theme/colors';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { BigButton } from '../components/BigButton';
import { ToggleRow } from '../components/Controls';
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
  const { palette, typography } = useTheme();
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
    setBusy(true);
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
  }, [sound, vibration, speech, autoPause, reminders, days, hour, minute, onDone]);

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
              { backgroundColor: i === step ? palette.primary : palette.border },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <View style={styles.step}>
            <View style={[styles.logoCircle, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <AppIcon name="my-location" size={56} color={palette.primary} />
            </View>
            <Text style={[typography.headline, { color: palette.text, fontSize: 30, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
              Welcome to RunTracker
            </Text>
            <Text style={[typography.body, styles.subtitle, { color: palette.textMuted, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
              Your offline running companion. Let's get you set up in under a minute.
            </Text>
            <View style={styles.featureList}>
              {FEATURES.map((f) => (
                <View key={f.title} style={[styles.featureCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                  <View style={[styles.featureIcon, { backgroundColor: palette.surfaceVariant }]}>
                    <AppIcon name={f.icon} size={20} color={palette.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[typography.body, { color: palette.text, fontWeight: '700' }]} maxFontSizeMultiplier={2}>
                      {f.title}
                    </Text>
                    <Text style={[typography.bodySmall, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                      {f.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.step}>
            <Text style={[typography.headline, { color: palette.text, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
              Set your preferences
            </Text>
            <Text style={[typography.body, styles.subtitle, { color: palette.textMuted, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
              You can change all of these later in Settings.
            </Text>
            <View style={styles.toggleGroup}>
              <ToggleRow
                label="Sound cues"
                hint="Beeps for start, pause and every kilometer"
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
              ) : null}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.step}>
            <View style={[styles.logoCircle, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <AppIcon name="gps-fixed" size={56} color={palette.primary} />
            </View>
            <Text style={[typography.headline, { color: palette.text, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
              Location access
            </Text>
            <Text style={[typography.body, styles.subtitle, { color: palette.textMuted, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
              To record your runs and show your position on the map, RunTracker needs location permission. It is never shared — everything stays on your device.
            </Text>
            <View style={[styles.privacyCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <AppIcon name="lock" size={18} color={palette.primary} />
              <Text style={[typography.bodySmall, { color: palette.text, flex: 1 }]} maxFontSizeMultiplier={2}>
                Location data is used only while you run and is stored locally.
              </Text>
            </View>
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
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  dot: {
    width: 8,
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
    borderWidth: 1,
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
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleGroup: {
    gap: spacing.sm,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
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
