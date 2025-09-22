// ProgressBar.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  percentage: number;
  style?: ViewStyle;
};

export const ProgressBar: React.FC<Props> = ({
  percentage,
}) => {
  // clamp to [0, 100]
  const pct = Math.max(0, Math.min(100, percentage));

  return (
    <View
      style={{
        height: 10, backgroundColor: '#E6E8EC', borderRadius: 5
        }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: '#4F46E5',
          borderRadius: 5,
        }}
      />
    </View>
  );
};
