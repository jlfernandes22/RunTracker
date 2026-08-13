import React, { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

interface SnackbarContextValue {
  showSnackbar: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextValue>({ showSnackbar: () => {} });

export function useSnackbar(): SnackbarContextValue {
  return useContext(SnackbarContext);
}

/**
 * Lightweight toast feedback for quick actions (exports, deletes).
 * More transient than dialogs — no button presses required.
 */
export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const showSnackbar = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hide}
        duration={2500}
        action={{ label: 'OK', onPress: hide }}
        style={{ backgroundColor: palette.inverseSurface }}
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
