import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { AlarmData } from './AddAlarmModal';

interface AlarmListItemProps {
  alarm: AlarmData & { id: string; isEnabled: boolean };
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AlarmListItem({ alarm, onToggle, onEdit, onDelete }: AlarmListItemProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');

  // 시간을 12시간 형식으로 변환
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 반복 설정이 "없음"이 아닐 때만 표시
  const shouldShowRepeat = alarm.repeatValue !== '없음';

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity 
        style={styles.content} 
        onPress={() => onEdit(alarm.id)}
        activeOpacity={0.7}
      >
        {/* 시간 표시 */}
        <ThemedView style={styles.timeContainer}>
          <ThemedText 
            style={[
              styles.timeText, 
              { 
                color: alarm.isEnabled ? textColor : secondaryTextColor,
                opacity: alarm.isEnabled ? 1 : 0.5
              }
            ]}
            allowFontScaling={false}
            numberOfLines={1}
          >
            {formatTime(alarm.selectedTime)}
          </ThemedText>
        </ThemedView>

        {/* 알람 정보 */}
        <ThemedView style={styles.infoContainer}>
          <ThemedText 
            style={[
              styles.labelText,
              { 
                color: alarm.isEnabled ? textColor : secondaryTextColor,
                opacity: alarm.isEnabled ? 1 : 0.5
              }
            ]}
          >
            {alarm.labelValue}
          </ThemedText>
          
          <ThemedView style={styles.detailsContainer}>
            {shouldShowRepeat && (
              <ThemedText 
                style={[
                  styles.detailText,
                  { 
                    color: secondaryTextColor,
                    opacity: alarm.isEnabled ? 1 : 0.5
                  }
                ]}
              >
                {alarm.repeatValue}
              </ThemedText>
            )}
            <ThemedText 
              style={[
                styles.detailText,
                { 
                  color: secondaryTextColor,
                  opacity: alarm.isEnabled ? 1 : 0.5
                }
              ]}
            >
              {alarm.soundValue}
            </ThemedText>
            {alarm.snoozeValue === '켜짐' && (
              <ThemedText 
                style={[
                  styles.detailText,
                  { 
                    color: secondaryTextColor,
                    opacity: alarm.isEnabled ? 1 : 0.5
                  }
                ]}
              >
                스누즈
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>

        {/* 활성화/비활성화 스위치 */}
        <ThemedView style={styles.switchContainer}>
          <Switch
            value={alarm.isEnabled}
            onValueChange={(enabled) => onToggle(alarm.id, enabled)}
            trackColor={{ false: '#767577', true: '#34C759' }}
            thumbColor={alarm.isEnabled ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </ThemedView>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 90, // 높이를 약간 늘림
  },
  timeContainer: {
    flex: 0,
    marginRight: 16,
    justifyContent: 'center', // 수직 중앙 정렬
    alignItems: 'flex-start', // 수평 왼쪽 정렬
    height: 40, // 명시적 높이 설정
    paddingVertical: 2, // 상하 여백
  },
  timeText: {
    fontSize: 32,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    lineHeight: 38, // 명시적 line height 설정
    includeFontPadding: false, // Android에서 폰트 패딩 제거
    textAlignVertical: 'center', // Android 텍스트 정렬
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '400',
  },
  switchContainer: {
    flex: 0,
    marginLeft: 16,
  },
});