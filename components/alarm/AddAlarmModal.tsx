import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7; // 화면의 70% 높이

interface AddAlarmModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddAlarmModal({ visible, onClose }: AddAlarmModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  
  // 애니메이션을 위한 Animated Value
  const translateY = React.useRef(new Animated.Value(MODAL_HEIGHT)).current;

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
        toValue: MODAL_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
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
              toValue: MODAL_HEIGHT,
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

  return (
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
          <ThemedText>여기에 알람 설정 UI가 들어갈 예정입니다.</ThemedText>
          {/* 나중에 시간 선택, 반복 설정 등의 UI 추가 */}
        </ThemedView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
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