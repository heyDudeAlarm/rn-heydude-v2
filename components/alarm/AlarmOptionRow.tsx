import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, Switch, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

interface AlarmOptionRowProps {
  label: string;
  value: string;
  type?: 'text' | 'input' | 'toggle';
  onPress?: () => void;
  onChangeText?: (text: string) => void;
  isToggled?: boolean;
  onToggle?: (toggled: boolean) => void;
}

export default function AlarmOptionRow({ 
  label, 
  value, 
  type = 'text', 
  onPress, 
  onChangeText,
  isToggled = false,
  onToggle 
}: AlarmOptionRowProps) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const renderValueComponent = () => {
    if (type === 'input') {
      return (
        <TextInput
          style={[styles.optionInput, { color: tintColor, backgroundColor }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={value ? '' : '알람 이름을 입력하세요'}
          placeholderTextColor={tintColor + '60'}
          clearButtonMode="while-editing"
        />
      );
    }

    if (type === 'toggle') {
      return (
        <Switch
          value={isToggled}
          onValueChange={onToggle}
          trackColor={{ false: '#767577', true: tintColor + '60' }}
          thumbColor={isToggled ? tintColor : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      );
    }
    
    return (
      <TouchableOpacity style={styles.optionValue} onPress={onPress}>
        <ThemedText style={[styles.optionValueText, { color: tintColor }]}>
          {value}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.optionRow}>
      <ThemedText style={styles.optionLabel}>{label}</ThemedText>
      {renderValueComponent()}
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
  optionInput: {
    fontSize: 17,
    fontWeight: '400',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 100,
    textAlign: 'right',
    borderWidth: 0,
  },
});