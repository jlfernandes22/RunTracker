import React, { createContext, useCallback, useContext, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Dialog as PaperDialog, Portal, Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/colors';
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
  const { palette } = useTheme();
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const alert = useCallback((opts: DialogOptions) => {
    setOptions(opts);
  }, []);

  const close = useCallback(() => setOptions(null), []);

  return (
    <DialogContext.Provider value={{ alert }}>
      {children}
      <Portal>
        <PaperDialog visible={options != null} onDismiss={close} style={styles.dialog}>
          {options ? (
            <>
              <PaperDialog.Title>
                <Text variant="titleLarge" style={{ color: palette.text }}>
                  {options.title}
                </Text>
              </PaperDialog.Title>
              {options.message ? (
                <PaperDialog.Content>
                  <Text variant="bodyLarge" style={{ color: palette.onSurfaceVariant }}>
                    {options.message}
                  </Text>
                </PaperDialog.Content>
              ) : null}
              <PaperDialog.Actions style={styles.actions}>
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
              </PaperDialog.Actions>
            </>
          ) : null}
        </PaperDialog>
      </Portal>
    </DialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 28,
  },
  actions: {
    padding: spacing.md,
    flexDirection: 'column',
    gap: spacing.sm,
  },
});
