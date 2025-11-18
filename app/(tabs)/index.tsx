import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import AddAlarmModal from '@/components/alarm/AddAlarmModal';
import AlarmHeader from '@/components/alarm/AlarmHeader';
import AlarmList, { AlarmItem } from '@/components/alarm/AlarmList';
import ParallaxScrollView from '@/components/layout/ParallaxScrollView';
import { AlarmData } from '@/types/alarm';

// AsyncStorage에 저장할 키
const ALARMS_STORAGE_KEY = '@heydude_alarms';

export default function HomeScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [editingAlarmId, setEditingAlarmId] = useState<string | undefined>();
  const [editingAlarmData, setEditingAlarmData] = useState<AlarmData | undefined>();

  // 로컬 스토리지에서 알람 데이터 로드
  const loadAlarms = async () => {
    try {
      const storedAlarms = await AsyncStorage.getItem(ALARMS_STORAGE_KEY);
      if (storedAlarms) {
        const parsedAlarms: AlarmItem[] = JSON.parse(storedAlarms);
        // Date 객체를 다시 생성 (JSON.parse는 Date를 문자열로 파싱)
        const alarmsWithDates = parsedAlarms.map(alarm => ({
          ...alarm,
          selectedTime: new Date(alarm.selectedTime),
        }));
        setAlarms(alarmsWithDates);
      }
    } catch (error) {
      console.error('❌ 알람 로드 실패:', error);
      // 에러 발생 시 빈 배열로 초기화
      setAlarms([]);
    }
  };

  // 로컬 스토리지에 알람 데이터 저장
  const saveAlarms = async (alarmsToSave: AlarmItem[]) => {
    try {
      await AsyncStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarmsToSave));
    } catch (error) {
      console.error('❌ 알람 저장 실패:', error);
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

  const handleSaveAlarm = async (alarmData: AlarmData) => {
    let updatedAlarms: AlarmItem[];

    if (editingAlarmId) {
      // 편집 모드: 기존 알람 업데이트
      updatedAlarms = alarms.map(alarm =>
        alarm.id === editingAlarmId
          ? { ...alarm, ...alarmData }
          : alarm
      );
    } else {
      // 신규 모드: 새 알람 추가
      const newAlarm: AlarmItem = {
        id: Date.now().toString(), // 간단한 ID 생성 (실제로는 uuid 사용 권장)
        ...alarmData,
        isEnabled: true, // 기본적으로 활성화 상태
      };
      updatedAlarms = [...alarms, newAlarm];
    }

    setAlarms(updatedAlarms);
    
    // 로컬 스토리지에 저장
    await saveAlarms(updatedAlarms);
    
    setIsModalVisible(false);
  };

  // 알람 활성화/비활성화 토글
  const handleToggleAlarm = async (id: string, enabled: boolean) => {
    const updatedAlarms = alarms.map(alarm =>
      alarm.id === id ? { ...alarm, isEnabled: enabled } : alarm
    );
    setAlarms(updatedAlarms);
    
    // 로컬 스토리지에 저장
    await saveAlarms(updatedAlarms);
  };

  // 알람 편집
  const handleEditAlarm = (id: string) => {
    const alarmToEdit = alarms.find(alarm => alarm.id === id);
    if (alarmToEdit) {
      setEditingAlarmId(id);
      setEditingAlarmData({
        selectedTime: alarmToEdit.selectedTime,
        selectedDays: alarmToEdit.selectedDays,
        repeatValue: alarmToEdit.repeatValue,
        labelValue: alarmToEdit.labelValue,
        soundValue: alarmToEdit.soundValue,
        snoozeValue: alarmToEdit.snoozeValue,
      });
      setIsModalVisible(true);
    }
  };

  // 알람 삭제
  const handleDeleteAlarm = async (id: string) => {
    const updatedAlarms = alarms.filter(alarm => alarm.id !== id);
    setAlarms(updatedAlarms);
    
    // 로컬 스토리지에 저장
    await saveAlarms(updatedAlarms);
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
