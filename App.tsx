/**
 * RunTracker — offline-first running companion
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { DialogProvider } from './src/components/Dialog';
import { setupChannels } from './src/services/notifications';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

/**
 * PaperProvider must sit ABOVE every Paper component (DialogProvider hosts a
 * Portal), so this wrapper reads the MD3 theme from ThemeContext and provides
 * it to both the main app and the onboarding branch.
 */
function ThemedPaperProvider({ children }: { children: React.ReactNode }) {
  const { paperTheme } = useTheme();
  return <PaperProvider theme={paperTheme}>{children}</PaperProvider>;
}

function ThemedApp() {
  const { palette } = useTheme();
  const r = parseInt(palette.background.slice(1, 3), 16);
  const g = parseInt(palette.background.slice(3, 5), 16);
  const b = parseInt(palette.background.slice(5, 7), 16);
  const isDarkBackground = 0.3 * r + 0.6 * g + 0.1 * b < 128;
  return (
    <>
      <StatusBar barStyle={isDarkBackground ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </>
  );
}

function App() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    setupChannels().catch(() => {});
    const { db } = require('./src/db/database');
    db.getSetting('onboarding.completed')
      .then((v: string | null) => setOnboardingDone(v === 'true'))
      .catch(() => setOnboardingDone(true));
  }, []);

  if (onboardingDone === null) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <View style={{ flex: 1, backgroundColor: '#131315' }} />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedPaperProvider>
            <DialogProvider>
              {onboardingDone ? (
                <ThemedApp />
              ) : (
                <OnboardingScreen onDone={() => setOnboardingDone(true)} />
              )}
            </DialogProvider>
          </ThemedPaperProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
