import { useThemeColor } from '@/hooks/use-theme-color';
import { StoredAlarmData } from '@/types/alarm';
import React, { useRef } from 'react';
import { Alert, Animated, PanResponder, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { IconSymbol } from '../ui/IconSymbol';

interface AlarmListItemProps {
  alarm: StoredAlarmData;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AlarmListItem({ alarm, onToggle, onEdit, onDelete }: AlarmListItemProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');

  // 스와이프 애니메이션을 위한 Animated.Value
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteButtonOpacity = useRef(new Animated.Value(0)).current;

  // PanResponder로 스와이프 제스처 처리
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 가로 스와이프가 세로 스와이프보다 클 때만 활성화
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // 왼쪽으로만 스와이프 허용 (dx < 0)
        if (gestureState.dx < 0) {
          const translateValue = Math.max(gestureState.dx, -80);
          translateX.setValue(translateValue);
          deleteButtonOpacity.setValue(Math.abs(translateValue) / 80);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -40) {
          // 40px 이상 스와이프하면 삭제 버튼을 완전히 표시
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: -80,
              useNativeDriver: false,
            }),
            Animated.timing(deleteButtonOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        } else {
          // 원래 위치로 되돌리기
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
            }),
            Animated.timing(deleteButtonOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert(
      '알람 삭제',
      '이 알람을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => {
            // 취소 시 원래 위치로 되돌리기
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: false,
              }),
              Animated.timing(deleteButtonOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }),
            ]).start();
          },
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => onDelete(alarm.id),
        },
      ]
    );
  };

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
      {/* 삭제 버튼 (뒤쪽) */}
      <Animated.View 
        style={[
          styles.deleteButtonContainer,
          {
            opacity: deleteButtonOpacity,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <IconSymbol name="trash" size={20} color="#fff" />
          <ThemedText style={styles.deleteButtonText}>삭제</ThemedText>
        </TouchableOpacity>
      </Animated.View>

      {/* 메인 콘텐츠 (앞쪽) */}
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX }],
          }
        ]}
        {...panResponder.panHandlers}
      >
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
                color: alarm.isActive ? textColor : secondaryTextColor,
                opacity: alarm.isActive ? 1 : 0.5
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
                color: alarm.isActive ? textColor : secondaryTextColor,
                opacity: alarm.isActive ? 1 : 0.5
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
                    opacity: alarm.isActive ? 1 : 0.5
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
                  opacity: alarm.isActive ? 1 : 0.5
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
                    opacity: alarm.isActive ? 1 : 0.5
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
            value={alarm.isActive}
            onValueChange={(enabled) => onToggle(alarm.id, enabled)}
            trackColor={{ false: '#767577', true: '#34C759' }}
            thumbColor={alarm.isActive ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </ThemedView>
      </TouchableOpacity>
      </Animated.View>
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
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '80%',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  swipeableContent: {
    backgroundColor: 'inherit',
  },
});