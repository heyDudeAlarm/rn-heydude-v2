import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

const DAYS_OF_WEEK = [
  { key: 'sunday', label: '일요일마다' },
  { key: 'monday', label: '월요일마다' },
  { key: 'tuesday', label: '화요일마다' },
  { key: 'wednesday', label: '수요일마다' },
  { key: 'thursday', label: '목요일마다' },
  { key: 'friday', label: '금요일마다' },
  { key: 'saturday', label: '토요일마다' },
];

const PRESET_OPTIONS = [
  { key: 'never', label: '없음' },
  { key: 'everyday', label: '매일' },
  { key: 'weekdays', label: '주중 (월~금)' },
  { key: 'weekends', label: '주말 (토~일)' },
];

interface RepeatSettingsContentProps {
  selectedDays: string[];
  onSave: (selectedDays: string[]) => void;
  onCancel: () => void;
}

export default function RepeatSettingsContent({ selectedDays, onSave, onCancel }: RepeatSettingsContentProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const [tempSelectedDays, setTempSelectedDays] = useState<string[]>(selectedDays);

  React.useEffect(() => {
    setTempSelectedDays(selectedDays);
  }, [selectedDays]);

  const toggleDay = (dayKey: string) => {
    setTempSelectedDays(prev => {
      if (prev.includes(dayKey)) {
        return prev.filter(day => day !== dayKey);
      } else {
        return [...prev, dayKey];
      }
    });
  };

  const selectPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'never':
        setTempSelectedDays([]);
        break;
      case 'everyday':
        setTempSelectedDays(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
        break;
      case 'weekdays':
        setTempSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
        break;
      case 'weekends':
        setTempSelectedDays(['saturday', 'sunday']);
        break;
    }
  };

  const handleCancel = () => {
    setTempSelectedDays(selectedDays);
    onSave(tempSelectedDays);
    onCancel();
  };

  const getRepeatDescription = () => {
    if (tempSelectedDays.length === 0) return '없음';
    if (tempSelectedDays.length === 7) return '매일';
    if (tempSelectedDays.length === 5 && 
        tempSelectedDays.includes('monday') && tempSelectedDays.includes('tuesday') && 
        tempSelectedDays.includes('wednesday') && tempSelectedDays.includes('thursday') && 
        tempSelectedDays.includes('friday')) {
      return '주중 (월~금)';
    }
    if (tempSelectedDays.length === 2 && 
        tempSelectedDays.includes('saturday') && tempSelectedDays.includes('sunday')) {
      return '주말 (토~일)';
    }
    return `${tempSelectedDays.length}일 선택됨`;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* 헤더 */}
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            console.log('🔥 CANCEL BUTTON PRESSED!');
            handleCancel();
          }} 
          style={[styles.cancelButton]}
          activeOpacity={0.3}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ThemedText style={[styles.headerButtonText]}>취소</ThemedText>
        </TouchableOpacity>
        
        <ThemedText type="title" style={styles.centerTitle}>반복</ThemedText>
        
        {/* 오른쪽 공간을 비워두기 위한 빈 뷰 */}
        <ThemedView style={styles.emptySpace} />
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* 프리셋 옵션들 */}
        <ThemedView style={styles.section}>
          {PRESET_OPTIONS.map((preset) => (
            <TouchableOpacity
              key={preset.key}
              style={styles.optionRow}
              onPress={() => selectPreset(preset.key)}
            >
              <ThemedText style={styles.optionLabel}>{preset.label}</ThemedText>
              {getRepeatDescription() === preset.label && (
                <IconSymbol 
                  size={20} 
                  name="checkmark" 
                  color={tintColor} 
                />
              )}
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* 개별 요일 선택 */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>개별 요일 선택</ThemedText>
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day.key}
              style={styles.optionRow}
              onPress={() => toggleDay(day.key)}
            >
              <ThemedText style={styles.optionLabel}>{day.label}</ThemedText>
              {tempSelectedDays.includes(day.key) && (
                <IconSymbol 
                  size={20} 
                  name="checkmark" 
                  color={tintColor} 
                />
              )}
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* 선택된 요일 미리보기 */}
        <ThemedView style={styles.previewSection}>
          <ThemedText style={styles.previewTitle}>선택됨: {getRepeatDescription()}</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    minWidth: 100,
    backgroundColor: 'red',
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySpace: {
    minWidth: 80,
  },
  centerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 8,
    opacity: 0.6,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  previewSection: {
    margin: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});