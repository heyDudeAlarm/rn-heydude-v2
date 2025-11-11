import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import AddAlarmModal, { AlarmData } from '@/components/alarm/AddAlarmModal';
import AlarmHeader from '@/components/alarm/AlarmHeader';
import AlarmList, { AlarmItem } from '@/components/alarm/AlarmList';
import ParallaxScrollView from '@/components/layout/ParallaxScrollView';

export default function HomeScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);

  const handleAddAlarm = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSaveAlarm = (alarmData: AlarmData) => {
    console.log('📱 메인페이지에서 받은 알람 데이터:', JSON.stringify(alarmData, null, 2));
    console.log('⏰ 설정된 시간:', alarmData.selectedTime.toLocaleTimeString());
    console.log('🔁 반복 설정:', alarmData.repeatValue);
    console.log('🏷️ 알람 라벨:', alarmData.labelValue);
    console.log('🔊 알람 사운드:', alarmData.soundValue);
    console.log('😴 스누즈 설정:', alarmData.snoozeValue);
    
    // 새로운 알람 아이템 생성
    const newAlarm: AlarmItem = {
      id: Date.now().toString(), // 간단한 ID 생성 (실제로는 uuid 사용 권장)
      ...alarmData,
      isEnabled: true, // 기본적으로 활성화 상태
    };

    // 알람 리스트에 추가
    setAlarms(prevAlarms => [...prevAlarms, newAlarm]);
    console.log('✅ 새로운 알람이 추가되었습니다:', newAlarm);
    
    setIsModalVisible(false);
  };

  // 알람 활성화/비활성화 토글
  const handleToggleAlarm = (id: string, enabled: boolean) => {
    setAlarms(prevAlarms =>
      prevAlarms.map(alarm =>
        alarm.id === id ? { ...alarm, isEnabled: enabled } : alarm
      )
    );
    console.log(`🔄 알람 ${id} ${enabled ? '활성화' : '비활성화'}`);
  };

  // 알람 편집 (향후 구현)
  const handleEditAlarm = (id: string) => {
    console.log('✏️ 알람 편집:', id);
    // TODO: 편집 모달 열기
  };

  // 알람 삭제
  const handleDeleteAlarm = (id: string) => {
    setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== id));
    console.log('🗑️ 알람 삭제:', id);
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
      />
    </>
  );
}

const styles = StyleSheet.create({
  // 나중에 필요한 스타일들을 여기에 추가
});
