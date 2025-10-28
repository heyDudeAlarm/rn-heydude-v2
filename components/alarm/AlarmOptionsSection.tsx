import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '../common/ThemedView';
import AlarmOptionRow from './AlarmOptionRow';

interface AlarmOptionsSectionProps {
  repeatValue: string;
  labelValue: string;
  soundValue: string;
  snoozeValue: string;
  snoozeToggled: boolean;
  onRepeatPress?: () => void;
  onLabelChange?: (text: string) => void;
  onSoundPress?: () => void;
  onSnoozeToggle?: (toggled: boolean) => void;
}

export default function AlarmOptionsSection({
  repeatValue,
  labelValue,
  soundValue,
  snoozeValue,
  snoozeToggled,
  onRepeatPress,
  onLabelChange,
  onSoundPress,
  onSnoozeToggle,
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
        type="input"
        onChangeText={onLabelChange}
      />
      
      <AlarmOptionRow 
        label="사운드" 
        value={soundValue}
        onPress={onSoundPress}
      />
      
      <AlarmOptionRow 
        label="다시 알림" 
        value={snoozeValue}
        type="toggle"
        isToggled={snoozeToggled}
        onToggle={onSnoozeToggle}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    flex: 1,
  },
});