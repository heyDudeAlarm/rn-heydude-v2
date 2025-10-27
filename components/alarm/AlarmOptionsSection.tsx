import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '../common/ThemedView';
import AlarmOptionRow from './AlarmOptionRow';

interface AlarmOptionsSectionProps {
  repeatValue: string;
  labelValue: string;
  soundValue: string;
  snoozeValue: string;
  onRepeatPress?: () => void;
  onLabelPress?: () => void;
  onSoundPress?: () => void;
  onSnoozePress?: () => void;
}

export default function AlarmOptionsSection({
  repeatValue,
  labelValue,
  soundValue,
  snoozeValue,
  onRepeatPress,
  onLabelPress,
  onSoundPress,
  onSnoozePress,
}: AlarmOptionsSectionProps) {
  return (
    <ThemedView style={styles.optionsContainer}>
      <AlarmOptionRow 
        label="반복" 
        value={repeatValue}
        onPress={onRepeatPress}
      />
      
      <AlarmOptionRow 
        label="레이블" 
        value={labelValue}
        onPress={onLabelPress}
      />
      
      <AlarmOptionRow 
        label="사운드" 
        value={soundValue}
        onPress={onSoundPress}
      />
      
      <AlarmOptionRow 
        label="다시 알림" 
        value={snoozeValue}
        onPress={onSnoozePress}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    flex: 1,
  },
});