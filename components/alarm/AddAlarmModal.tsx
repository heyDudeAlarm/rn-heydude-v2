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
import RepeatSettingsContent from './RepeatSettingsContent';
import SoundSettingsContent from './SoundSettingsContent';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export interface AlarmData {
  selectedTime: Date;
  repeatValue: string;
  labelValue: string;
  soundValue: string;
  snoozeValue: string;
}

interface AddAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (alarmData: AlarmData) => void;
}

export default function AddAlarmModal({ visible, onClose, onSave }: AddAlarmModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();
  
  // 알람 설정 상태
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [repeatValue, setRepeatValue] = useState('없음');
  const [labelValue, setLabelValue] = useState('알람');
  const [soundValue, setSoundValue] = useState('레이더');
  const [snoozeEnabled, setSnoozeEnabled] = useState(false);
  
  // 화면 전환 상태
  const [currentView, setCurrentView] = useState<'main' | 'repeat' | 'sound'>('main');
  
  // 알람 설정 컴포넌트 위로 올라오는 애니메이션
  const translateY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current; // modal 위아래 애니메이션
  // 화면 슬라이드 애니메이션
  const slideAnim = React.useRef(new Animated.Value(0)).current; // 좌우 슬라이드 애니메이션

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
        onStartShouldSetPanResponder: () => {
          console.log('PanResponder onStartShouldSetPanResponder, currentView:', currentView);
          return currentView === 'main'; // 메인 화면일 때만 PanResponder 활성화
        },
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // 메인 화면이고 아래쪽으로 드래그할 때만 반응
          return currentView === 'main' && gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
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
    [translateY, onClose, currentView]
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
    console.log('Repeat button pressed, showing repeat settings');
    setCurrentView('repeat');
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH, // 왼쪽으로 슬라이드
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleRepeatSave = (newSelectedDays: string[]) => {
    console.log('Repeat save called with:', newSelectedDays);
    setSelectedDays(newSelectedDays);
    setRepeatValue(getRepeatDisplayValue(newSelectedDays));
    goBackToMain();
  };

  const goBackToMain = () => {
    Animated.timing(slideAnim, {
      toValue: 0, // 원래 위치로
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentView('main');
    });
  };

  const handleLabelChange = (text: string) => {
    console.log('Label changed to:', text);
    setLabelValue(text);
  };

  const handleSoundPress = () => {
    console.log('Sound button pressed, showing sound settings');
    setCurrentView('sound');
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH * 2, // 사운드 화면으로 슬라이드 (세 번째 화면)
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSoundSave = (selectedSound: string) => {
    // 사운드 키를 표시용 텍스트로 변환
    const soundLabels: { [key: string]: string } = {
      'radar': '레이더',
      'classic': '클래식',
      'bell': '벨',
      'chime': '차임',
      'digital': '디지털',
      'horn': '호른',
      'wave': '웨이브',
      'marimba': '마림바'
    };
    setSoundValue(soundLabels[selectedSound] || selectedSound);
  };

  // 현재 사운드 값을 키로 변환하는 함수
  const getCurrentSoundKey = () => {
    const soundKeyMap: { [key: string]: string } = {
      '레이더': 'radar',
      '클래식': 'classic',
      '벨': 'bell',
      '차임': 'chime',
      '디지털': 'digital',
      '호른': 'horn',
      '웨이브': 'wave',
      '마림바': 'marimba'
    };
    return soundKeyMap[soundValue] || 'radar';
  };

  const handleSnoozeToggle = (toggled: boolean) => {
    console.log('Snooze toggle changed to:', toggled);
    setSnoozeEnabled(toggled);
  };

  const handleComplete = () => {
    // 알람 데이터를 JSON 객체로 수집
    const alarmData: AlarmData = {
      selectedTime,
      repeatValue,
      labelValue,
      soundValue,
      snoozeValue: snoozeEnabled ? '켜짐' : '꺼짐'
    };
    
    console.log('Complete button pressed, alarm data:', alarmData);
    
    // 메인페이지로 데이터 전달
    onSave(alarmData);
    
    // 모달 닫기
    onClose();
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

          {/* 슬라이드 컨테이너 */}
          <ThemedView style={styles.slideContainer}>
            <Animated.View 
              style={[
                styles.slideContent,
                { transform: [{ translateX: slideAnim }] }
              ]}
            >
              {/* 메인 화면 */}
              <ThemedView style={styles.screenContainer}>
                {/* 헤더 */}
                <ThemedView style={styles.header}>
                  <ThemedView style={styles.titleContainer}>
                    <ThemedText 
                      type="title"
                      style={styles.headerTitle}
                      allowFontScaling={false}
                      numberOfLines={1}
                    >
                      알람 추가
                    </ThemedText>
                  </ThemedView>
                  <TouchableOpacity onPress={handleComplete} style={styles.closeButton}>
                    <ThemedText style={styles.completeText}>완료</ThemedText>
                  </TouchableOpacity>
                </ThemedView>

                <AlarmTimePicker
                  selectedTime={selectedTime}
                  onTimeChange={setSelectedTime}
                />

                <AlarmOptionsSection
                  repeatValue={repeatValue}
                  labelValue={labelValue}
                  soundValue={soundValue}
                  snoozeValue={snoozeEnabled ? '켜짐' : '꺼짐'}
                  snoozeToggled={snoozeEnabled}
                  onRepeatPress={handleRepeatPress}
                  onLabelChange={handleLabelChange}
                  onSoundPress={handleSoundPress}
                  onSnoozeToggle={handleSnoozeToggle}
                />
              </ThemedView>

              <ThemedView style={styles.screenContainer}>
                { currentView === 'repeat' && (
                  <RepeatSettingsContent
                    selectedDays={selectedDays}
                    onSave={handleRepeatSave}
                    onCancel={goBackToMain}
                  />
                )}
              </ThemedView>


              {/* 사운드 설정 화면 */}
              <ThemedView style={styles.screenContainer}>
                { currentView === 'sound' && (
                  <SoundSettingsContent
                    selectedSound={getCurrentSoundKey()}
                    onSave={handleSoundSave}
                    onCancel={goBackToMain}
                  />
                )}
              </ThemedView>
            </Animated.View>
          </ThemedView>
        </Animated.View>
      </Modal>
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
    paddingTop: 25, // 상단 패딩 더 크게
    paddingBottom: 20, // 하단 패딩
    minHeight: 70, // 최소 높이 더 크게
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: 40, // 명시적 높이
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 18, // 폰트 크기 명시적 설정
    fontWeight: '600', // 폰트 굵기 명시적 설정
    lineHeight: 28, // 라인 높이 더 크게
    includeFontPadding: false, // Android 폰트 패딩 제거
    textAlignVertical: 'center', // Android 텍스트 정렬
  },
  closeButton: {
    padding: 8, // 패딩 더 크게
    minHeight: 32, // 최소 높이 설정
    justifyContent: 'center',
  },
  completeText: {
    fontSize: 16, // 폰트 크기 명시적 설정
    fontWeight: '500', // 폰트 굵기
    lineHeight: 22, // 라인 높이 더 크게
    paddingVertical: 2, // 텍스트 상하 패딩
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  slideContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  slideContent: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3, // 3개 화면 지원 (메인, 반복, 사운드)
    height: '100%',
  },
  screenContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    padding: 20,
  },
});