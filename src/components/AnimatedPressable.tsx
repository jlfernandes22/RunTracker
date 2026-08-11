import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { createAnimatedComponent } from 'react-native-reanimated';
import { useM3PressScale } from '../hooks/useM3PressScale';

const AnimatedPressableComponent = createAnimatedComponent(Pressable);

interface Props extends PressableProps {
  /** Content styled by the caller (cards etc.). */
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

/**
 * Pressable with MD3 press-scale feedback (spatialFast spring, reduce-motion aware).
 * Safe to use inside list renderItem callbacks.
 */
export function AnimatedPressable({ style, scaleTo, children, onPressIn, onPressOut, ...rest }: Props) {
  const { animatedStyle, onPressIn: m3In, onPressOut: m3Out } = useM3PressScale(scaleTo);
  return (
    <AnimatedPressableComponent
      {...rest}
      onPressIn={(e) => {
        m3In();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        m3Out();
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableComponent>
  );
}
