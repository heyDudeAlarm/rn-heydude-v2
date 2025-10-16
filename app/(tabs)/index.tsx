import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import AddAlarmModal from '@/components/add-alarm-modal';
import AlarmHeader from '@/components/alarm-header';
import ParallaxScrollView from '@/components/parallax-scroll-view';

export default function HomeScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleAddAlarm = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <ParallaxScrollView>
        <AlarmHeader onAddAlarm={handleAddAlarm} />
        {/* 여기에 나중에 AlarmList 컴포넌트를 추가할 예정 */}
      </ParallaxScrollView>
      
      <AddAlarmModal 
        visible={isModalVisible} 
        onClose={handleCloseModal} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  // 나중에 필요한 스타일들을 여기에 추가
});
