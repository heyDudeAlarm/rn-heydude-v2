import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RepeatSettingsModalProps {
  visible: boolean;
  selectedDays: string[];
  onClose: (selectedDays: string[]) => void;
}

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

export default function RepeatSettingsModal({ visible, selectedDays, onClose }: RepeatSettingsModalProps) {
  console.log('RepeatSettingsModal rendered, visible:', visible, 'selectedDays:', selectedDays);
  
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();
  const [tempSelectedDays, setTempSelectedDays] = useState<string[]>(selectedDays);
  
  // props가 변경될 때 내부 상태 동기화
  useEffect(() => {
    setTempSelectedDays(selectedDays);
  }, [selectedDays]);
  
  // 오른쪽 슬라이드 애니메이션을 위한 Animated Value
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // 모달이 보일 때 애니메이션 실행
  useEffect(() => {
    if (visible) {
      // 오른쪽에서 왼쪽으로 슬라이드인
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // 왼쪽에서 오른쪽으로 슬라이드아웃
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // 애니메이션 완료 후 초기값으로 리셋
        slideAnim.setValue(SCREEN_WIDTH);
      });
    }
  }, [visible, slideAnim]);

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

  const handleSave = () => {
    onClose(tempSelectedDays);
  };

  const handleCancel = () => {
    // 임시 선택값을 원래대로 되돌리기
    setTempSelectedDays(selectedDays);
    // 모달 닫기 (애니메이션은 useEffect에서 처리)
    onClose(selectedDays);
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
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
    >
      <Animated.View 
        style={[
          styles.container, 
          { 
            backgroundColor,
            paddingTop: insets.top,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
      {/* 헤더 */}
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <ThemedText style={[styles.headerButtonText, { color: tintColor }]}>취소</ThemedText>
        </TouchableOpacity>
        
        <ThemedText type="title">반복</ThemedText>
        
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <ThemedText style={[styles.headerButtonText, { color: tintColor }]}>저장</ThemedText>
        </TouchableOpacity>
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
      </Animated.View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    minWidth: 50,
  },
  saveButton: {
    minWidth: 50,
    alignItems: 'flex-end',
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