import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/colors';
import { BigButton } from './BigButton';
import { AppIconName } from './AppIcon';

export interface DialogButton {
  label: string;
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost';
  icon?: AppIconName;
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message?: string;
  buttons: DialogButton[];
}

interface DialogContextValue {
  alert: (options: DialogOptions) => void;
}

const DialogContext = createContext<DialogContextValue>({ alert: () => {} });

export function useDialog(): DialogContextValue {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const { palette, typography } = useTheme();
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const alert = useCallback((opts: DialogOptions) => {
    setOptions(opts);
  }, []);

  const close = useCallback(() => setOptions(null), []);

  return (
    <DialogContext.Provider value={{ alert }}>
      {children}
      <Modal visible={options != null} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          {options ? (
            <View
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
              accessibilityViewIsModal
            >
              <Text style={[typography.headlineMobile, { color: palette.text }]} maxFontSizeMultiplier={2}>
                {options.title}
              </Text>
              {options.message ? (
                <Text style={[typography.body, { color: palette.textMuted }]} maxFontSizeMultiplier={2}>
                  {options.message}
                </Text>
              ) : null}
              <View style={styles.buttons}>
                {options.buttons.map((b, i) => (
                  <BigButton
                    key={i}
                    label={b.label}
                    icon={b.icon}
                    variant={b.variant ?? 'primary'}
                    onPress={() => {
                      close();
                      b.onPress?.();
                    }}
                    style={{ width: '100%' }}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  buttons: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
