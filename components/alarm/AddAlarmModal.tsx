import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import AlarmOptionsSection from './AlarmOptionsSection';
import AlarmTimePicker from './AlarmTimePicker';
import RepeatSettingsModal from './RepeatSettingsModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.95; // 화면의 95% 높이 (상단 여백 조금)

interface AddAlarmModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddAlarmModal({ visible, onClose }: AddAlarmModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();
  
  // 알람 설정 상태
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [repeatValue, setRepeatValue] = useState('없음');
  const [labelValue, setLabelValue] = useState('알람');
  const [soundValue, setSoundValue] = useState('레이더');
  const [snoozeValue, setSnoozeValue] = useState('9분');
  
  // 모달 상태
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  
  // 애니메이션을 위한 Animated Value (화면 높이만큼 아래에서 시작)
  const translateY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // 모달이 보일 때 애니메이션 실행
  React.useEffect(() => {
    if (visible) {
      // 위로 올라오는 애니메이션
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      // 아래로 내려가는 애니메이션
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // 애니메이션 완료 후 초기값으로 리셋
        translateY.setValue(SCREEN_HEIGHT);
      });
    }
  }, [visible, translateY]);

  // 드래그 제스처 처리
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // 아래쪽으로 드래그할 때만 반응
          return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        },
        onPanResponderMove: (_, gestureState) => {
          // 아래쪽으로만 드래그 허용
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          // 드래그 속도나 거리에 따라 모달 닫기 결정
          if (gestureState.dy > 100 || gestureState.vy > 0.5) {
            // 모달 닫기
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              onClose();
            });
          } else {
            // 원래 위치로 되돌리기
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          }
        },
      }),
    [translateY, onClose]
  );

  // 반복 설정 관련 함수들
  const getRepeatDisplayValue = (days: string[]) => {
    if (days.length === 0) return '없음';
    if (days.length === 7) return '매일';
    if (days.length === 5 && 
        days.includes('monday') && days.includes('tuesday') && 
        days.includes('wednesday') && days.includes('thursday') && 
        days.includes('friday')) {
      return '주중 (월~금)';
    }
    if (days.length === 2 && 
        days.includes('saturday') && days.includes('sunday')) {
      return '주말 (토~일)';
    }
    return `${days.length}일 선택됨`;
  };

  const handleRepeatPress = () => {
    console.log('Repeat button pressed, opening modal');
    setShowRepeatModal(true);
  };

  const handleRepeatSave = (newSelectedDays: string[]) => {
    console.log('Repeat save called with:', newSelectedDays);
    setSelectedDays(newSelectedDays);
    setRepeatValue(getRepeatDisplayValue(newSelectedDays));
    setShowRepeatModal(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        {/* 배경 오버레이 */}
        <TouchableWithoutFeedback onPress={onClose}>
          <ThemedView style={styles.overlay} />
        </TouchableWithoutFeedback>

        {/* 모달 컨텐츠 */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor,
              height: SCREEN_HEIGHT - insets.top, // 상태바 아래부터 시작
              top: insets.top, // Safe Area 상단에서 시작
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* 드래그 핸들 */}
          <ThemedView style={[styles.dragHandle, { backgroundColor: tintColor, opacity: 0.3 }]} />
          
          {/* 헤더 */}
          <ThemedView style={styles.header}>
            <ThemedText type="title">알람 추가</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText>완료</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* 컨텐츠 영역 */}
          <ThemedView style={styles.content}>
            <AlarmTimePicker
              selectedTime={selectedTime}
              onTimeChange={setSelectedTime}
            />

            <AlarmOptionsSection
              repeatValue={repeatValue}
              labelValue={labelValue}
              soundValue={soundValue}
              snoozeValue={snoozeValue}
              onRepeatPress={handleRepeatPress}
              onLabelPress={() => console.log('Label pressed')}
              onSoundPress={() => console.log('Sound pressed')}
              onSnoozePress={() => console.log('Snooze pressed')}
            />
          </ThemedView>
        </Animated.View>
      </Modal>

      {/* 반복 설정 모달 - 독립적인 풀스크린 모달 */}
      <RepeatSettingsModal
        visible={showRepeatModal}
        selectedDays={selectedDays}
        onClose={handleRepeatSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});