import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import AddAlarmModal from '@/components/alarm/AddAlarmModal';
import AlarmHeader from '@/components/alarm/AlarmHeader';
import AlarmList, { AlarmItem } from '@/components/alarm/AlarmList';
import { ThemedText } from '@/components/common/ThemedText';
import ParallaxScrollView from '@/components/layout/ParallaxScrollView';
import { StoredAlarmData } from '@/types/alarm';
import { deleteAlarm, getStoredAlarms, restoreAlarms, toggleAlarm } from '@/utils/alarmService';
import { clearAllSoundFiles, getStorageSoundFiles, initializeSounds } from '@/utils/soundManager';

export default function HomeScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [editingAlarmId, setEditingAlarmId] = useState<string | undefined>();
  const [editingAlarmData, setEditingAlarmData] = useState<StoredAlarmData | undefined>();

  // 사운드 초기화 및 알람 복원
  const initializeApp = useCallback(async () => {
    try {
      // 사운드 파일 초기화
      console.log('🎵 사운드 파일 초기화 시작...');
      await initializeSounds();
      console.log('✅ 사운드 파일 초기화 완료');
      
      // 알람 복원
      console.log('⏰ 알람 복원 시작...');
      await restoreAlarms();
      console.log('✅ 알람 복원 완료');
      
      // 저장된 알람 로드
      await loadAlarms();
    } catch (error) {
      console.error('❌ 앱 초기화 실패:', error);
      Alert.alert('오류', '앱 초기화에 실패했습니다. 앱을 다시 시작해주세요.');
    }
  }, []);

  // 저장된 알람들을 로드
  const loadAlarms = async () => {
    try {
      const storedAlarms = await getStoredAlarms();
      // Date 객체를 다시 생성 (JSON.parse는 Date를 문자열로 파싱)
      const alarmsWithDates = storedAlarms.map(alarm => ({
        ...alarm,
        selectedTime: new Date(alarm.selectedTime),
      }));
      setAlarms(alarmsWithDates);
      console.log(`✅ ${alarmsWithDates.length}개 알람 로드 완료`);
    } catch (error) {
      console.error('❌ 알람 로드 실패:', error);
      Alert.alert('오류', '알람 데이터를 불러오는 중 오류가 발생했습니다.');
      setAlarms([]);
    }
  };

  // 컴포넌트 마운트 시 앱 초기화
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleAddAlarm = () => {
    // 신규 알람 추가
    setEditingAlarmId(undefined);
    setEditingAlarmData(undefined);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingAlarmId(undefined);
    setEditingAlarmData(undefined);
  };

  const handleSaveAlarm = async (savedAlarm: StoredAlarmData) => {
    // 알람이 이미 저장되어 있으므로 목록만 업데이트
    await loadAlarms(); // 최신 데이터로 새로고침
    setIsModalVisible(false);
    setEditingAlarmId(undefined);
    setEditingAlarmData(undefined);
  };

  // 알람 활성화/비활성화 토글
  const handleToggleAlarm = async (id: string, enabled: boolean) => {
    try {
      await toggleAlarm(id, enabled);
      // UI 즉시 업데이트
      setAlarms(prev => prev.map(alarm =>
        alarm.id === id ? { ...alarm, isActive: enabled } : alarm
      ));
    } catch (error) {
      console.error('알람 토글 오류:', error);
      Alert.alert('오류', '알람 설정을 변경할 수 없습니다.');
    }
  };

  // 알람 편집
  const handleEditAlarm = (id: string) => {
    const alarmToEdit = alarms.find(alarm => alarm.id === id);
    if (alarmToEdit) {
      setEditingAlarmId(id);
      setEditingAlarmData(alarmToEdit);
      setIsModalVisible(true);
    }
  };

  // 알람 삭제
  const handleDeleteAlarm = async (id: string) => {
    try {
      await deleteAlarm(id);
      setAlarms(prev => prev.filter(alarm => alarm.id !== id));
    } catch (error) {
      console.error('알람 삭제 오류:', error);
      Alert.alert('오류', '알람을 삭제할 수 없습니다.');
    }
  };

  // 사운드 파일 모두 삭제 (개발 모드에서만)
  const handleClearAllSounds = async () => {
    try {
      const beforeFiles = await getStorageSoundFiles();
      console.log('삭제 전 파일들:', beforeFiles);
      
      if (beforeFiles.length === 0) {
        Alert.alert('알림', '삭제할 사운드 파일이 없습니다.');
        return;
      }
      
      Alert.alert(
        '사운드 파일 삭제',
        `${beforeFiles.length}개의 사운드 파일을 모두 삭제하시겠습니까?\n\n파일 목록:\n${beforeFiles.join('\n')}`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🗑️ 사운드 파일 삭제 시작...');
                await clearAllSoundFiles();
                
                const afterFiles = await getStorageSoundFiles();
                console.log('삭제 후 파일들:', afterFiles);
                
                if (afterFiles.length === 0) {
                  Alert.alert('완료', '모든 사운드 파일이 삭제되었습니다.');
                } else {
                  Alert.alert('부분 완료', `${afterFiles.length}개의 파일이 남아있습니다:\n${afterFiles.join('\n')}`);
                }
              } catch (error) {
                console.error('사운드 파일 삭제 실패:', error);
                Alert.alert('오류', '사운드 파일 삭제 중 오류가 발생했습니다.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('사운드 파일 확인 실패:', error);
      Alert.alert('오류', '사운드 파일을 확인할 수 없습니다.');
    }
  };

  return (
    <>
      <ParallaxScrollView>
        <AlarmHeader onAddAlarm={handleAddAlarm} />
        <AlarmList
          alarms={alarms}
          onToggleAlarm={handleToggleAlarm}
          onEditAlarm={handleEditAlarm}
          onDeleteAlarm={handleDeleteAlarm}
        />
        
        {/* 개발 모드에서만 보이는 사운드 파일 삭제 버튼 */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <TouchableOpacity 
              style={styles.clearSoundsButton}
              onPress={handleClearAllSounds}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.clearSoundsButtonText}>
                🗑️ 모든 사운드 파일 삭제 (개발용)
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ParallaxScrollView>
      
      <AddAlarmModal 
        visible={isModalVisible} 
        onClose={handleCloseModal}
        onSave={handleSaveAlarm}
        editAlarmId={editingAlarmId}
        editAlarmData={editingAlarmData}
      />
    </>
  );
}

const styles = StyleSheet.create({
  devSection: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  clearSoundsButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearSoundsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
