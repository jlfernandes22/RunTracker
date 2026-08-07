import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export type AppIconName =
  | 'directions-run'
  | 'history'
  | 'map'
  | 'settings'
  | 'my-location'
  | 'gps-fixed'
  | 'gps-not-fixed'
  | 'volume-up'
  | 'format-list-bulleted'
  | 'add'
  | 'undo'
  | 'close'
  | 'check'
  | 'calendar-today'
  | 'local-fire-department'
  | 'directions-walk'
  | 'route'
  | 'edit'
  | 'file-download'
  | 'delete'
  | 'navigate-next'
  | 'play-arrow'
  | 'pause'
  | 'stop'
  | 'visibility'
  | 'visibility-off'
  | 'notifications'
  | 'notifications-off'
  | 'trending-up'
  | 'flag'
  | 'cloud-off'
  | 'lock'
  | 'schedule'
  | 'keyboard-arrow-up'
  | 'keyboard-arrow-down';

interface Props {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: any;
}

export function AppIcon({ name, size = 22, color = '#FFFFFF', style }: Props) {
  return <MaterialIcons name={name} size={size} color={color} style={style} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}
