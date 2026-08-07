import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  progress: number; // 0..1
  color: string;
  trackColor: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function ProgressRing({ progress, color, trackColor, size = 104, strokeWidth = 10, children }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ * clamped} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}
