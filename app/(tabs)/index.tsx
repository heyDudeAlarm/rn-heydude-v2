import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import AddAlarmModal from '@/components/alarm/AddAlarmModal';
import AlarmHeader from '@/components/alarm/AlarmHeader';
import AlarmList, { AlarmItem } from '@/components/alarm/AlarmList';
import ParallaxScrollView from '@/components/layout/ParallaxScrollView';
import { StoredAlarmData } from '@/types/alarm';
import { deleteAlarm, getStoredAlarms, toggleAlarm } from '@/utils/alarmService';

export default function HomeScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [editingAlarmId, setEditingAlarmId] = useState<string | undefined>();
  const [editingAlarmData, setEditingAlarmData] = useState<StoredAlarmData | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // 저장된 알람들을 로드
  const loadAlarms = async () => {
    try {
      setIsLoading(true);
      const storedAlarms = await getStoredAlarms();
      // Date 객체를 다시 생성 (JSON.parse는 Date를 문자열로 파싱)
      const alarmsWithDates = storedAlarms.map(alarm => ({
        ...alarm,
        selectedTime: new Date(alarm.selectedTime),
      }));
      setAlarms(alarmsWithDates);
    } catch (error) {
      console.error('❌ 알람 로드 실패:', error);
      Alert.alert('오류', '알람 데이터를 불러오는 중 오류가 발생했습니다.');
      setAlarms([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 저장된 알람들 로드
  useEffect(() => {
    loadAlarms();
  }, []);

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
  // 나중에 필요한 스타일들을 여기에 추가
});
