import * as Notifications from 'expo-notifications';
import { snoozeCurrentAlarm, stopCurrentAlarm } from './alarmControl';
import { playAlarmSound, SoundType } from './soundManager';

// 알림 리스너 설정
export const setupNotificationListeners = () => {
  // 포그라운드에서 알림 수신 시
  const foregroundSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
    const data = notification.request.content.data;
    
    if (data && data.type === 'alarm' && data.soundType) {
      try {
        console.log('포그라운드에서 알람 수신, 커스텀 사운드 재생:', data.soundType);
        await playAlarmSound(data.soundType as SoundType, 30000);
      } catch (error) {
        console.error('포그라운드 커스텀 사운드 재생 실패:', error);
      }
    }
  });

  // 알림 응답 리스너 (사용자가 알림을 탭했을 때)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data;
    const actionIdentifier = response.actionIdentifier;
    
    if (data && data.type === 'alarm') {
      console.log('알람 알림 응답 수신:', data, 'Action:', actionIdentifier);
      
      // 중지 버튼이 클릭된 경우
      if (actionIdentifier === 'stop') {
        try {
          console.log('알람 중지 버튼 클릭됨');
          await stopCurrentAlarm();
        } catch (error) {
          console.error('알람 중지 실패:', error);
        }
      }
      // 스누즈 버튼이 클릭된 경우  
      else if (actionIdentifier === 'snooze') {
        try {
          console.log('알람 스누즈 버튼 클릭됨');
          await snoozeCurrentAlarm(data, 5);
        } catch (error) {
          console.error('알람 스누즈 실패:', error);
        }
      }
      // 일반 알림 탭 (앱 열기)
      else {
        console.log('알람 알림 일반 탭 - 알람 사운드 중지');
        await stopCurrentAlarm();
      }
    }
  });

  return {
    foregroundSubscription,
    responseSubscription,
  };
};

// 리스너 정리
export const cleanupNotificationListeners = (subscriptions: {
  foregroundSubscription: Notifications.Subscription;
  responseSubscription: Notifications.Subscription;
}) => {
  subscriptions.foregroundSubscription.remove();
  subscriptions.responseSubscription.remove();
};