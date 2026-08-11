import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chip, Text } from 'react-native-paper';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { createAnimatedComponent } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radii } from '../theme/colors';import { overlayTokens } from '../theme/tokens';

import { BigButton } from './BigButton';
import { AppIcon } from './AppIcon';
import { useM3PressScale } from '../hooks/useM3PressScale';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MINUTE_STEP = 5;

const PRESETS = [
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
];

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((d) => b.includes(d));
}

function wrap(value: number, min: number, max: number): number {
  if (value < min) return max;
  if (value > max) return min;
  return value;
}

interface Props {
  days: number[];
  onDaysChange: (days: number[]) => void;
  hour: number;
  minute: number;
  onTimeChange: (hour: number, minute: number) => void;
}

function StepButton({
  dir,
  onStep,
  label,
  color,
}: {
  dir: 1 | -1;
  onStep: (dir: 1 | -1) => void;
  label: string;
  color: string;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = useM3PressScale(0.92);

  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => clear, []);

  const begin = () => {
    onStep(dir);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => onStep(dir), 120);
    }, 700);
  };

  const StepPressable = React.useMemo(() => createAnimatedComponent(Pressable), []);
  return (
    <StepPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => {
        scaleIn();
        begin();
      }}
      onPressOut={() => {
        scaleOut();
        clear();
      }}
      style={[styles.stepButton, animatedStyle]}
    >
      <AppIcon name={dir === 1 ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={30} color={color} />
    </StepPressable>
  );
}

export function ReminderPicker({ days, onDaysChange, hour, minute, onTimeChange }: Props) {
  const { palette } = useTheme();
  const [timeOpen, setTimeOpen] = useState(false);
  const [draftHour, setDraftHour] = useState(hour);
  const [draftMinute, setDraftMinute] = useState(minute);

  const toggleDay = (day: number) => {
    onDaysChange(days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort());
  };

  const timeLabel = useMemo(
    () => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    [hour, minute],
  );
  const draftLabel = `${String(draftHour).padStart(2, '0')}:${String(draftMinute).padStart(2, '0')}`;

  const openPicker = () => {
    setDraftHour(hour);
    setDraftMinute(minute);
    setTimeOpen(true);
  };

  const stepHour = (dir: 1 | -1) =>
    setDraftHour((h) => wrap(h + dir, 0, 23));
  const stepMinute = (dir: 1 | -1) =>
    setDraftMinute((m) => wrap(m + dir * MINUTE_STEP, 0, 60 - MINUTE_STEP));

  return (
    <View style={styles.group}>
      <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
        Days
      </Text>
      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <BigButton
            key={p.label}
            label={p.label}
            variant={sameSet(days, p.days) ? 'primary' : 'secondary'}
            onPress={() => onDaysChange([...p.days].sort())}
            style={{ flex: 1, paddingHorizontal: 0, minHeight: 40, minWidth: 42 }}
          />
        ))}
      </View>
      <View style={styles.dayRow}>
        {DAY_NAMES.map((d, i) => (
          <Chip
            key={d}
            selected={days.includes(i)}
            onPress={() => toggleDay(i)}
            accessibilityHint={days.includes(i) ? `Remove reminder for ${d}` : `Add reminder for ${d}`}
            style={styles.dayChip}
          >
            {d}
          </Chip>
        ))}
      </View>

      <Text variant="labelMedium" style={{ color: palette.textMuted }} maxFontSizeMultiplier={2}>
        Time
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Reminder time ${timeLabel}`}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.timeRow,
          { backgroundColor: palette.surface, borderColor: palette.border },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={styles.timeRowLeft}>
          <AppIcon name="schedule" size={18} color={palette.primary} />
          <Text variant="bodyLarge" style={{ color: palette.text, fontWeight: '700' }} maxFontSizeMultiplier={2}>
            {timeLabel}
          </Text>
        </View>
        <AppIcon name="keyboard-arrow-down" size={20} color={palette.textMuted} />
      </Pressable>

      <Modal visible={timeOpen} transparent animationType="fade" onRequestClose={() => setTimeOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.modal, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text variant="titleLarge" style={{ color: palette.text, textAlign: 'center' }} maxFontSizeMultiplier={2}>
              Reminder time
            </Text>

            <View style={styles.displayWrap}>
              <Text
                variant="displayMedium"
                style={{ color: palette.primary }}
                maxFontSizeMultiplier={2}
                accessibilityLiveRegion="polite"
              >
                {draftLabel}
              </Text>
            </View>

            <View style={styles.steppersRow}>
              <View style={styles.stepper}>
                <Text variant="labelMedium" style={{ color: palette.textMuted, marginBottom: spacing.xs }} maxFontSizeMultiplier={2}>
                  Hour
                </Text>
                <StepButton dir={1} onStep={stepHour} label="Increase hour" color={palette.primary} />
                <View style={[styles.stepperValue, { borderColor: palette.border, backgroundColor: palette.surfaceVariant }]}>
                  <Text variant="titleLarge" style={[{ fontWeight: '800' }, { color: palette.text }]} maxFontSizeMultiplier={2}>
                    {String(draftHour).padStart(2, '0')}
                  </Text>
                </View>
                <StepButton dir={-1} onStep={stepHour} label="Decrease hour" color={palette.primary} />
              </View>

              <View style={styles.stepper}>
                <Text variant="labelMedium" style={{ color: palette.textMuted, marginBottom: spacing.xs }} maxFontSizeMultiplier={2}>
                  Minute
                </Text>
                <StepButton dir={1} onStep={stepMinute} label="Increase minute" color={palette.primary} />
                <View style={[styles.stepperValue, { borderColor: palette.border, backgroundColor: palette.surfaceVariant }]}>
                  <Text variant="titleLarge" style={[{ fontWeight: '800' }, { color: palette.text }]} maxFontSizeMultiplier={2}>
                    {String(draftMinute).padStart(2, '0')}
                  </Text>
                </View>
                <StepButton dir={-1} onStep={stepMinute} label="Decrease minute" color={palette.primary} />
              </View>
            </View>

            <Text variant="labelMedium" style={{ color: palette.textMuted, textAlign: 'center' }} maxFontSizeMultiplier={2}>
              Steps of 5 minutes · hold a button to scroll
            </Text>

            <View style={styles.modalActions}>
              <BigButton label="Cancel" variant="ghost" onPress={() => setTimeOpen(false)} style={{ flex: 1 }} />
              <BigButton
                label="Set time"
                onPress={() => {
                  onTimeChange(draftHour, draftMinute);
                  setTimeOpen(false);
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dayChip: {
    minWidth: 44,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  timeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backdrop: {
    flex: 1,
    backgroundColor: overlayTokens.scrimOverlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  displayWrap: {
    alignItems: 'center',
  },
  steppersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl * 2,
  },
  stepper: {
    alignItems: 'center',
  },
  stepButton: {
    width: 56,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 96,
    minHeight: 68,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
