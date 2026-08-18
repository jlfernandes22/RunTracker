import React, { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native-paper';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, radii } from '../theme/tokens';
import { SectionLabel, SettingRow, SettingsGroup, ToggleRow } from '../components/Controls';
import { ScreenHeader } from '../components/ScreenHeader';
import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { SegmentedButtons } from '../components/SegmentedButtons';
import { ReminderPicker } from '../components/ReminderPicker';
import { useDialog } from '../components/Dialog';
import { db } from '../db/database';
import {
  DEFAULT_PREFS,
  loadPrefs,
  NotificationPrefs,
  requestNotificationPermission,
  savePrefs,
} from '../services/notifications';
import { exportBackup, importBackup, pickBackupFile, readBackupPreview, shareBackup } from '../services/backup';
import { setSoundEnabled, setVibrationEnabled } from '../services/AudioCue';
import { MergeStrategy } from '../types';

export function SettingsScreen() {
  const {
    palette,
    settings,
    setHighContrast,
    setReduceMotion,
    setFontScale,
    setThemeMode,
    setAmoledBlack,
  } = useTheme();
  const dialog = useDialog();
  const [prefs, setPrefs] = useState<NotificationPrefs>({ ...DEFAULT_PREFS });
  const [autoPause, setAutoPause] = useState(true);
  const [speech, setSpeech] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadPrefs().then(setPrefs);
    db.getSetting('run.autoPause').then((v) => setAutoPause(v == null ? true : v === 'true'));
    db.getSetting('run.speechCues').then((v) => setSpeech(v == null ? true : v === 'true'));
    db.getSetting('run.soundCues').then((v) => {
      const enabled = v == null ? true : v === 'true';
      setSound(enabled);
      setSoundEnabled(enabled);
    });
    db.getSetting('run.vibration').then((v) => {
      const enabled = v == null ? true : v === 'true';
      setVibration(enabled);
      setVibrationEnabled(enabled);
    });
  }, []);

  const setAutoPausePref = useCallback((v: boolean) => {
    setAutoPause(v);
    db.setSetting('run.autoPause', String(v));
  }, []);

  const setSpeechPref = useCallback((v: boolean) => {
    setSpeech(v);
    db.setSetting('run.speechCues', String(v));
  }, []);

  const setSoundPref = useCallback((v: boolean) => {
    setSound(v);
    setSoundEnabled(v);
    db.setSetting('run.soundCues', String(v));
  }, []);

  const setVibrationPref = useCallback((v: boolean) => {
    setVibration(v);
    setVibrationEnabled(v);
    db.setSetting('run.vibration', String(v));
  }, []);

  const onEnableNotifications = useCallback(async (v: boolean) => {
    if (v) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        dialog.alert({
          title: 'Notifications blocked',
          message: 'Enable notifications for this app in system settings.',
          buttons: [{ label: 'OK' }],
        });
        return;
      }
    }
    const next = { ...prefs, enabled: v };
    setPrefs(next);
    await savePrefs(next);
  }, [prefs, dialog]);

  const onExport = useCallback(async () => {
    setBusy(true);
    try {
      const path = await exportBackup();
      if (path) {
        dialog.alert({
          title: 'Backup created',
          message: 'Share or save the backup file.',
          buttons: [
            { label: 'Close', variant: 'ghost' },
            { label: 'Share', onPress: () => shareBackup(path) },
          ],
        });
      }
    } catch (e: any) {
      dialog.alert({ title: 'Export failed', message: String(e?.message ?? e), buttons: [{ label: 'OK' }] });
    } finally {
      setBusy(false);
    }
  }, [dialog]);

  const onImport = useCallback(async () => {
    setBusy(true);
    try {
      const zipPath = await pickBackupFile();
      if (!zipPath) return;
      const preview = await readBackupPreview(zipPath);
      if (!preview) return;
      dialog.alert({
        title: 'Import backup',
        message: `${preview.runs} runs and ${preview.routes} routes found. How should duplicates be handled?`,
        buttons: [
          { label: 'Cancel', variant: 'ghost' },
          { label: 'Skip duplicates', onPress: () => doImportRef.current('skip', zipPath) },
          { label: 'Replace existing', variant: 'secondary', onPress: () => doImportRef.current('replace', zipPath) },
          { label: 'Keep both', onPress: () => doImportRef.current('keep', zipPath) },
        ],
      });
    } catch (e: any) {
      dialog.alert({ title: 'Import failed', message: String(e?.message ?? e), buttons: [{ label: 'OK' }] });
    } finally {
      setBusy(false);
    }
  }, [dialog]);

  const doImportRef = React.useRef<(strategy: MergeStrategy, zipPath: string) => void>(() => {});
  const doImport = useCallback(async (strategy: MergeStrategy, zipPath: string) => {
    setBusy(true);
    try {
      const result = await importBackup(zipPath, strategy);
      dialog.alert({ title: 'Import complete', message: `Imported ${result.runs} runs and ${result.routes} routes.`, buttons: [{ label: 'OK' }] });
    } catch (e: any) {
      dialog.alert({ title: 'Import failed', message: String(e?.message ?? e), buttons: [{ label: 'OK' }] });
    } finally {
      setBusy(false);
    }
  }, [dialog]);
  doImportRef.current = doImport;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: palette.background }]}>
      <ScreenHeader title="Settings" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>Appearance</SectionLabel>
        <SettingsGroup>
          <View style={styles.themeModeWrap}>
            <Text variant="bodyLarge" style={{ color: palette.onSurface, fontWeight: '600', marginBottom: spacing.xs }}>
              Theme
            </Text>
            <SegmentedButtons<ThemeMode>
              value={settings.themeMode}
              onValueChange={setThemeMode}
              buttons={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </View>
          {settings.themeMode !== 'light' ? (
            <ToggleRow
              label="AMOLED / Pitch Black"
              hint={
                settings.themeMode === 'system'
                  ? 'Pure #000000 black background when system is in dark mode'
                  : 'Pure #000000 black background for OLED screens'
              }
              value={settings.amoledBlack}
              onValueChange={setAmoledBlack}
            />
          ) : null}
          <ToggleRow
            label="High contrast theme"
            hint="Switches to a high-contrast palette with strong color contrast"
            value={settings.highContrast}
            onValueChange={setHighContrast}
          />
          <ToggleRow
            label="Reduce motion"
            hint="Disables spring animations and transitions"
            value={settings.reduceMotion}
            onValueChange={setReduceMotion}
          />
          <SettingRow
            label="Larger text"
            value={settings.fontScale === 1 ? 'Default' : `${Math.round(settings.fontScale * 100)}%`}
            onPress={() =>
              dialog.alert({
                title: 'Larger text',
                message: 'Choose a text size multiplier.',
                buttons: [
                  { label: 'Default (100%)', variant: settings.fontScale === 1 ? 'primary' : 'secondary', onPress: () => setFontScale(1) },
                  { label: '110%', variant: settings.fontScale === 1.1 ? 'primary' : 'secondary', onPress: () => setFontScale(1.1) },
                  { label: '125%', variant: settings.fontScale === 1.25 ? 'primary' : 'secondary', onPress: () => setFontScale(1.25) },
                  { label: '150%', variant: settings.fontScale === 1.5 ? 'primary' : 'secondary', onPress: () => setFontScale(1.5) },
                ],
              })
            }
            hint="Scales app typography beyond the system setting"
          />
        </SettingsGroup>

        <SectionLabel>Run tracking</SectionLabel>
        <SettingsGroup>
          <ToggleRow
            label="Auto-pause when standing still"
            hint="Pauses recording when speed drops, resumes when you move"
            value={autoPause}
            onValueChange={setAutoPausePref}
          />
          <ToggleRow
            label="Spoken km markers"
            hint="Announces each kilometer during a run"
            value={speech}
            onValueChange={setSpeechPref}
          />
          <ToggleRow
            label="Sound cues"
            hint="Audio beeps for start, pause, and each kilometer"
            value={sound}
            onValueChange={setSoundPref}
          />
          <ToggleRow
            label="Vibration"
            hint="Haptic feedback for run events"
            value={vibration}
            onValueChange={setVibrationPref}
          />
        </SettingsGroup>

        <SectionLabel>Run reminders</SectionLabel>
        <SettingsGroup>
          <ToggleRow
            label="Run reminders"
            hint="Sends local notifications on your chosen days and times"
            value={prefs.enabled}
            onValueChange={onEnableNotifications}
          />
          {prefs.enabled ? (
            <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
              <ReminderPicker
                days={prefs.days}
                onDaysChange={(days) => {
                  const next = { ...prefs, days };
                  setPrefs(next);
                  savePrefs(next);
                }}
                hour={prefs.hour}
                minute={prefs.minute}
                onTimeChange={(hour, minute) => {
                  const next = { ...prefs, hour, minute };
                  setPrefs(next);
                  savePrefs(next);
                }}
              />
              <ToggleRow
                label="Rest-day reminders"
                hint="Encouraging nudges on days you do not run"
                value={prefs.restReminders}
                onValueChange={(v) => {
                  const next = { ...prefs, restReminders: v };
                  setPrefs(next);
                  savePrefs(next);
                }}
                style={{ paddingHorizontal: 0 }}
              />
            </View>
          ) : null}
        </SettingsGroup>

        <SectionLabel>Backup & restore</SectionLabel>
        <SettingsGroup>
          <View style={styles.backupActions}>
            <BigButton
              label="Export backup (JSON + GPX)"
              icon="file-download"
              onPress={onExport}
              variant="secondary"
              disabled={busy}
              accessibilityHint="Creates a zip backup of all runs, routes, and settings"
              style={{ width: '100%' }}
            />
            <BigButton
              label="Import backup"
              onPress={onImport}
              variant="secondary"
              disabled={busy}
              accessibilityHint="Restores from a backup zip, with duplicate handling options"
              style={{ width: '100%' }}
            />
            <Text variant="bodySmall" style={{ color: palette.onSurfaceVariant, textAlign: 'center' }} maxFontSizeMultiplier={2}>
              Backups stay on this device. They are not uploaded anywhere.
            </Text>
          </View>
        </SettingsGroup>

        <SectionLabel>About</SectionLabel>
        <Card variant="filled" contentStyle={styles.aboutCard}>
          <Text variant="titleMedium" style={{ color: palette.onSurface, fontWeight: '700' }} maxFontSizeMultiplier={2}>
            RunTracker v0.1 — Material Design 3
          </Text>
          <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant }} maxFontSizeMultiplier={2}>
            100% offline running companion. No account, no cloud, no tracking. All data is stored locally.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  themeModeWrap: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  backupActions: {
    padding: spacing.md,
    gap: spacing.md,
  },
  aboutCard: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
