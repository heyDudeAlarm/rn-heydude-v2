import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DAYS_OF_WEEK, DayOfWeek, PresetKey, REPEAT_PRESETS, getRepeatDisplayText } from '@/types/alarm';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

const PRESET_OPTIONS: Array<{ key: PresetKey; label: string }> = [
  { key: 'never', label: '없음' },
  { key: 'everyday', label: '매일' },
  { key: 'weekdays', label: '주중 (월~금)' },
  { key: 'weekends', label: '주말 (토~일)' },
];

interface RepeatSettingsContentProps {
  selectedDays: DayOfWeek[];
  onSave: (selectedDays: DayOfWeek[]) => void;
  onCancel: () => void;
}

export default function RepeatSettingsContent({ selectedDays, onSave, onCancel }: RepeatSettingsContentProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const [tempSelectedDays, setTempSelectedDays] = useState<DayOfWeek[]>(selectedDays);

  React.useEffect(() => {
    setTempSelectedDays(selectedDays);
  }, [selectedDays]);

  const toggleDay = (dayKey: DayOfWeek) => {
    setTempSelectedDays(prev => {
      if (prev.includes(dayKey)) {
        return prev.filter(day => day !== dayKey);
      } else {
        return [...prev, dayKey];
      }
    });
  };

  const selectPreset = (presetKey: PresetKey) => {
    const preset = REPEAT_PRESETS[presetKey];
    if (preset) {
      setTempSelectedDays([...preset.days]);
    }
  };

  const handleCancel = () => {
    setTempSelectedDays(selectedDays);
    onSave(tempSelectedDays);
    onCancel();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* 헤더 */}
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            handleCancel();
          }}
          onPressIn={() => {
          }}
          onPressOut={() => {
          }}
          style={[styles.cancelButton]}
          activeOpacity={0.6}
          hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
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
              {getRepeatDisplayText(tempSelectedDays) === preset.label && (
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
          <ThemedText style={styles.previewTitle}>선택됨: {getRepeatDisplayText(tempSelectedDays)}</ThemedText>
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    minHeight: 64, // 헤더 최소 높이 설정
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    minWidth: 80,
    minHeight: 44, // iOS 권장 최소 터치 영역
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // 디버깅을 위한 배경색 제거
    // backgroundColor: 'transparent',
  },
  emptySpace: {
    minWidth: 80,
  },
  centerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    pointerEvents: 'none', // 터치 이벤트가 뒤의 요소로 전달되도록 함
  },
  headerButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#007AFF', // iOS 표준 링크 색상
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