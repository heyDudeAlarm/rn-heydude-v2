import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

interface AlarmOptionRowProps {
  label: string;
  value: string;
  onPress?: () => void;
}

export default function AlarmOptionRow({ label, value, onPress }: AlarmOptionRowProps) {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.optionRow}>
      <ThemedText style={styles.optionLabel}>{label}</ThemedText>
      <TouchableOpacity style={styles.optionValue} onPress={onPress}>
        <ThemedText style={[styles.optionValueText, { color: tintColor }]}>
          {value}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  optionValue: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  optionValueText: {
    fontSize: 17,
    fontWeight: '400',
  },
});