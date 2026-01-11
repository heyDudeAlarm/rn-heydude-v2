import * as Notifications from 'expo-notifications';
import { stopAlarmSound } from './soundManager';

// 알람 중지 기능
export const stopCurrentAlarm = async (): Promise<void> => {
  try {
    console.log('알람 중지 요청');
    
    // 1. 커스텀 사운드 중지
    await stopAlarmSound();
    
    // 2. 모든 예약된 알림 취소 (현재 울리고 있는 알람만)
    await Notifications.dismissAllNotificationsAsync();
    
    console.log('알람 중지 완료');
  } catch (error) {
    console.error('알람 중지 실패:', error);
    throw error;
  }
};

// 스누즈 기능
export const snoozeCurrentAlarm = async (originalData: any, snoozeMinutes: number = 5): Promise<void> => {
  try {
    console.log(`알람 스누즈 요청 (${snoozeMinutes}분)`);
    
    // 1. 현재 알람 중지
    await stopCurrentAlarm();
    
    // 2. 스누즈 알람 설정
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + snoozeMinutes);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 스누즈 알람!',
        body: `⏰ ${originalData.labelValue || '알람'}\\n${snoozeMinutes}분 후 다시 울립니다!`,
        sound: false,
        categoryIdentifier: 'alarm',
        data: { 
          ...originalData, 
          type: 'alarm',
          isSnooze: true 
        },
      },
      trigger: { seconds: snoozeMinutes * 60 } as any,
    });
    
    console.log('스누즈 알람 설정 완료');
  } catch (error) {
    console.error('스누즈 설정 실패:', error);
    throw error;
  }
};