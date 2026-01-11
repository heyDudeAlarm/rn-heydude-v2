import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { IconSymbol } from '../ui/IconSymbol';

interface AlarmHeaderProps {
  onAddAlarm: () => void;
}

export default function AlarmHeader({ onAddAlarm }: AlarmHeaderProps) {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.titleContainer}>
      <ThemedText type="title">Alarm</ThemedText>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={onAddAlarm}
        activeOpacity={0.7}
      >
        <IconSymbol 
          size={24} 
          name="plus" 
          color={tintColor} 
        />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 60
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  }
});