# MIGRATION_INVENTORY

Generated during the MD3 migration, step 1. Source of truth for the component/color/motion sweep.

| File | Lines | RN primitives | Hardcoded colors | Hardcoded fontSize | Animated API |
| --- | --- | --- | --- | --- | --- |
| components/AppIcon.tsx | 50 | — | #FFFFFF | — | no |
| components/BigButton.tsx | 104 | Pressable, Text, View | #FFFFFF | — | no |
| components/Controls.tsx | 134 | Pressable, Text, View | — | fontSize: 18 | no |
| components/Dialog.tsx | 102 | Modal, Text, View | — | — | no |
| components/EmptyState.tsx | 44 | Text, View | — | — | no |
| components/LocateButton.tsx | 65 | ActivityIndicator, Pressable | — | — | no |
| components/MapWebView.tsx | 186 | View | #E8EAED | — | no |
| components/MetricCard.tsx | 65 | Text, View | — | fontSize: 14 | no |
| components/ProgressRing.tsx | 37 | View | — | — | no |
| components/ReminderPicker.tsx | 314 | Modal, Pressable, Text, View | — | fontSize: 40, fontSize: 64 | no |
| components/ScreenHeader.tsx | 35 | Text, View | — | — | no |
| db/database.ts | 182 | — | — | — | no |
| lib/geo.ts | 121 | — | — | — | no |
| map/mapHtml.ts | 3 | — | #0078A8, #008F2E, #14171A, #1A1A1A, #1A6FD6, #2D8CFF, #32D74B, #3388ff, #3E90FF, #4C7BE1, #585858, #5AA7FF, #757575, #D64545, #E0BC00, #E8EAED, #FFD500, #FFFFFF, #f4f4f4 | — | no |
| navigation/RootNavigator.tsx | 133 | — | — | fontSize: 11 | no |
| screens/HistoryScreen.tsx | 269 | FlatList, Pressable, Text, View | — | fontSize: 11, fontSize: 18 | no |
| screens/MapPlannerScreen.tsx | 159 | Text, TextInput, View | — | fontSize: 15 | no |
| screens/OnboardingScreen.tsx | 300 | ScrollView, Text, View | — | fontSize: 30 | no |
| screens/PlanScreen.tsx | 119 | FlatList, Pressable, Text, View | — | fontSize: 18 | no |
| screens/RouteDetailScreen.tsx | 166 | Modal, ScrollView, Text, View | — | fontSize: 13, fontSize: 14, fontSize: 16, fontSize: 20 | no |
| screens/RunDetailScreen.tsx | 316 | Modal, ScrollView, Text, TextInput, View | — | fontSize: 13, fontSize: 14, fontSize: 15, fontSize: 16, fontSize: 20 | no |
| screens/RunScreen.tsx | 426 | Modal, Pressable, Text, View | — | — | no |
| screens/SettingsScreen.tsx | 314 | ScrollView, Text, View | — | fontSize: 13, fontSize: 14, fontSize: 28 | no |
| services/AudioCue.ts | 113 | — | — | — | no |
| services/RunSession.ts | 529 | — | — | — | no |
| services/backup.ts | 188 | — | — | — | no |
| services/notifications.ts | 154 | — | — | — | no |
| theme/ThemeContext.tsx | 175 | — | — | — | no |
| theme/colors.ts | 104 | — | #000000, #0033AA, #0A0F0A, #111111, #131315, #141414, #1A1A1A, #1F1F21, #2C2C2E, #2FBF4F, #30D158, #32D74B, #333336, #3E90FF, #646464, #70FF76, #9A9AA0, #B26A00, #BA1A1A, #E0E0E0, #E5E5E7, #F0F0F0, #F2F2F2, #F5F5F7, #F9F9FB, #FF6B6B, #FFD60A, #FFFFFF | — | no |
| types.ts | 40 | — | — | — | no |

## Screens tree

- App root: `App.tsx` (PaperProvider target, GestureHandlerRootView, SafeAreaProvider, DialogProvider, ThemeProvider)
- Navigation: `src/navigation/RootNavigator.tsx` — bottom tabs (Run / History / Plan / Settings) + native stacks
  - Run → `RunScreen`
  - History → `HistoryScreen` → `RunDetailScreen`
  - Plan → `PlanScreen` → `MapPlannerScreen` / `RouteDetailScreen`
  - Settings → `SettingsScreen`

## Reusable components

- `BigButton` (app-wide button primitive; variants primary/secondary/danger/ghost) → Paper `Button` modes
- `Controls.tsx`: `ToggleRow`, `SettingRow`, `SectionLabel` → Paper `Switch` + `List.Item`
- `Dialog.tsx` (custom modal) → Paper `Portal` + `Dialog`
- `ReminderPicker` (day chips + stepper time picker) → Paper `Chip` + tokens
- `MapWebView`, `LocateButton`, `ProgressRing`, `EmptyState`, `ScreenHeader`, `AppIcon`, `MetricCard`

## Hardcoded color hotspots (must move to tokens)

- `src/components/MapWebView.tsx` — WebView container background `#E8EAED`
- `src/screens/RunScreen.tsx`, `RunDetailScreen.tsx` — misc `rgba(255,255,255,0.12)` borders
- `App.tsx` — splash background `#131315`
- `src/theme/colors.ts` — whole file becomes the token source

## Motion inventory

- No react-native-reanimated usage yet; no `Animated` API usage in app code.
- Press feedback currently `opacity/scale` in Pressable styles (to be replaced by `useM3PressScale`).
- Dialogs/sheets use plain `Modal` `animationType="fade"` (to be replaced by Reanimated entering/exiting).

## Loading inventory

- Single `ActivityIndicator` in `LocateButton` (short wait → M3 LoadingIndicator at 24dp).
- History/Plan/RunDetail load from SQLite without any placeholder → skeleton + shimmer pass.

## Legacy deps removed earlier (context)

notifee, react-native-sqlite-storage, react-native-fs, react-native-tts, react-native-sound,
react-native-document-picker, react-native-geolocation-service, react-native-background-actions.
