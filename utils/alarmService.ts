import { AlarmData, DayOfWeek } from '@/types/alarm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SoundType } from './soundManager';

// 사운드 값을 SoundType으로 변환 - 이제 단순히 문자열 그대로 사용
const getSoundTypeFromValue = (soundValue: string): SoundType => {
  // 파일명에 확장자가 없으면 그대로 사용 (loadSound에서 .wav 추가)
  // 있으면 그대로 사용
  return soundValue || 'default';
};

// 알람 데이터 인터페이스 확장
export interface StoredAlarmData extends AlarmData {
  id: string;
  isActive: boolean;
  notificationIds: string[]; // 여러 개의 알림 ID (반복 알람의 경우)
  createdAt: string;
}

// 알림 설정 - 사운드 재생은 포그라운드 리스너에서만 처리
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // 백그라운드에서는 알림만 표시하고 사운드는 포그라운드 리스너에서 처리
    console.log('알림 핸들러에서 알림 수신:', notification.request.content.data);
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: false, // 커스텀 사운드를 사용하므로 시스템 사운드 비활성화
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

// 요일을 숫자로 변환 (일요일: 1, 월요일: 2, ..., 토요일: 7)
const dayOfWeekToNumber = (day: DayOfWeek): number => {
  const dayMap: Record<DayOfWeek, number> = {
    sunday: 1,
    monday: 2,
    tuesday: 3,
    wednesday: 4,
    thursday: 5,
    friday: 6,
    saturday: 7,
  };
  return dayMap[day];
};

// 백그라운드 알람 지원 설정
export const configureBackgroundAlarms = async (): Promise<void> => {
  if (Platform.OS === 'ios') {
    // iOS에서 백그라운드 알람을 위한 추가 설정
    await Notifications.setNotificationCategoryAsync('background-alarm', [
      {
        identifier: 'wake_up',
        buttonTitle: '일어나기',
        options: { 
          opensAppToForeground: true,
          isDestructive: false,
        },
      },
      {
        identifier: 'stop_alarm',
        buttonTitle: '알람 중지',
        options: { 
          opensAppToForeground: true,
          isDestructive: true,
        },
      },
    });
  }
  
  console.log('✅ 백그라운드 알람 설정 완료');
};

// 알림 권한 요청
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    console.warn('알림은 실제 디바이스에서만 작동합니다');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('알림 권한이 거부되었습니다');
    return false;
  }

  // 플랫폼별 알람 설정
  if (Platform.OS === 'ios') {
    // iOS 잠금화면에서 더 눈에 띄는 알람을 위한 카테고리 설정
    await Notifications.setNotificationCategoryAsync('alarm', [
      {
        identifier: 'stop',
        buttonTitle: '⏹️ 중지',
        options: { 
          opensAppToForeground: true,
          isDestructive: false,
        },
      },
      {
        identifier: 'snooze',
        buttonTitle: '⏰ 5분 후',
        options: { 
          opensAppToForeground: false,
          isDestructive: false,
        },
      },
      {
        identifier: 'open',
        buttonTitle: '📱 앱 열기',
        options: { 
          opensAppToForeground: true,
          isDestructive: false,
        },
      },
    ], {
      // iOS에서 잠금화면 큰 알림을 위한 옵션
      previewFormat: '%@',
      intentIdentifiers: [],
      hiddenPreviewsBodyPlaceholder: '알람이 울리고 있습니다',
    } as any);
  } else {
    // Android 알람 채널 설정 - 잠금화면 큰 알림을 위해 CRITICAL 설정
    await Notifications.setNotificationChannelAsync('alarm', {
      name: '알람',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      description: '알람 알림 - 잠금화면 전체 표시',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  return true;
};

// 알람 스케줄링
export const scheduleAlarm = async (alarmData: AlarmData, alarmId: string): Promise<string[]> => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error('알림 권한이 필요합니다');
  }

  const notificationIds: string[] = [];
  const { selectedTime, selectedDays, labelValue, soundValue } = alarmData;

  try {
    if (selectedDays.length === 0) {
      // 일회성 알람 - 정확히 00초에 울리도록 설정
      const exactTime = new Date(selectedTime);
      exactTime.setSeconds(0, 0); // 초와 밀리초를 0으로 설정
      
      // 만약 설정한 시간이 현재 시간보다 이전이면 다음날로 설정
      const now = new Date();
      if (exactTime <= now) {
        exactTime.setDate(exactTime.getDate() + 1);
      }
      
      const soundType = getSoundTypeFromValue(soundValue);
      const notificationRequest: any = {
        content: {
          title: '🚨 알람 울림!',
          body: `⏰ ${labelValue}\n지금 일어날 시간입니다!`,
          sound: soundValue === '없음' ? false : false, // 시스템 소리 비활성화 (커스텀 사운드만 사용)
          categoryIdentifier: Platform.OS === 'ios' ? 'alarm' : undefined,
          data: { 
            alarmId, 
            type: 'alarm',
            soundType: soundType, // 커스텀 사운드 정보 추가
            soundValue: soundValue,
            labelValue: labelValue
          },
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          sticky: true,
          autoDismiss: false,
          badge: 1,
          // iOS 잠금화면 최적화 및 앱 종료 시에도 알람 지속
          ...(Platform.OS === 'ios' && {
            critical: true, // Critical alert로 설정 (방해금지 모드도 우회)
            interruptionLevel: 'critical',
            subtitle: '지금 일어나세요!',
            threadIdentifier: 'alarm',
            // 앱이 종료되어도 알람이 계속 울리도록 설정
            launchImageName: 'AlarmLaunchImage',
            attachments: [],
          }),
        },
        trigger: exactTime,
      };

      // Android의 경우 잠금화면 큰 알림 및 앱 종료 시에도 알람 지속
      if (Platform.OS === 'android') {
        notificationRequest.content.android = {
          channelId: 'alarm',
          priority: 'max',
          importance: 'high',
          // 앱이 종료되어도 전체 화면 알람 표시
          fullScreenIntent: {
            launchActivity: 'default',
          },
          visibility: 'public',
          showWhen: true,
          ongoing: true, // 지속적인 알림
          timeoutAfter: null, // 자동 사라지지 않음
          // 앱 종료 시에도 알람 지속을 위한 설정
          autoCancel: false,
          insistent: true, // 반복적인 알림
          colorized: true,
          color: '#FF3B30',
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync(notificationRequest);
      notificationIds.push(notificationId);
    } else {
      // 반복 알람
      const soundType = getSoundTypeFromValue(soundValue);
      for (const day of selectedDays) {
        const notificationRequest: any = {
          content: {
            title: '🚨 알람 울림!',
            body: `⏰ ${labelValue}\n지금 일어날 시간입니다!`,
            sound: soundValue === '없음' ? false : false, // 커스텀 사운드만 사용
            categoryIdentifier: Platform.OS === 'ios' ? 'alarm' : undefined,
            data: { 
              alarmId, 
              type: 'alarm',
              soundType: soundType, // 커스텀 사운드 정보 추가
              soundValue: soundValue,
              labelValue: labelValue
            },
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 250, 250, 250],
            sticky: true,
            autoDismiss: false,
            badge: 1,
            // iOS 잠금화면 최적화
            ...(Platform.OS === 'ios' && {
              critical: true, // Critical alert로 설정 (방해금지 모드도 우회)
              interruptionLevel: 'critical',
              subtitle: '지금 일어나세요!',
              threadIdentifier: 'alarm',
            }),
          },
          trigger: {
            weekday: dayOfWeekToNumber(day),
            hour: selectedTime.getHours(),
            minute: selectedTime.getMinutes(),
            second: 0, // 정확히 00초에 울리도록 설정
            repeats: true,
          } as any,
        };

        // Android의 경우 잠금화면 큰 알림을 위한 설정 추가
        if (Platform.OS === 'android') {
          notificationRequest.content.android = {
            channelId: 'alarm',
            priority: 'max',
            importance: 'high',
            fullScreenIntent: {
              launchActivity: 'default',
            },
            visibility: 'public',
            showWhen: true,
            ongoing: true,
            timeoutAfter: null,
          };
        }

        const notificationId = await Notifications.scheduleNotificationAsync(notificationRequest);
        notificationIds.push(notificationId);
      }
    }

    return notificationIds;
  } catch (error) {
    console.error('알람 스케줄링 오류:', error);
    throw new Error('알람을 설정할 수 없습니다');
  }
};

// 알람 취소
export const cancelAlarm = async (notificationIds: string[]): Promise<void> => {
  try {
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (error) {
    console.error('알람 취소 오류:', error);
  }
};

// 저장된 알람 목록 가져오기
export const getStoredAlarms = async (): Promise<StoredAlarmData[]> => {
  try {
    const alarmsJson = await AsyncStorage.getItem('@alarms');
    return alarmsJson ? JSON.parse(alarmsJson) : [];
  } catch (error) {
    console.error('알람 데이터 로드 오류:', error);
    return [];
  }
};

// 알람 저장
export const saveAlarm = async (alarmData: AlarmData, alarmId?: string): Promise<StoredAlarmData> => {
  try {
    const alarms = await getStoredAlarms();
    const id = alarmId || `alarm_${Date.now()}`;
    
    // 기존 알람이 있다면 먼저 취소
    if (alarmId) {
      const existingAlarm = alarms.find(alarm => alarm.id === alarmId);
      if (existingAlarm) {
        await cancelAlarm(existingAlarm.notificationIds);
      }
    }

    // 새 알람 스케줄링
    const notificationIds = await scheduleAlarm(alarmData, id);

    // selectedTime을 정확히 00초로 설정
    const exactSelectedTime = new Date(alarmData.selectedTime);
    exactSelectedTime.setSeconds(0, 0); // 초와 밀리초를 0으로 설정

    const storedAlarm: StoredAlarmData = {
      ...alarmData,
      id,
      isActive: true,
      notificationIds,
      createdAt: new Date().toISOString(),
      selectedTime: exactSelectedTime, // 정확한 시간으로 저장
    };

    // 기존 알람 업데이트 또는 새 알람 추가
    let updatedAlarms;
    if (alarmId) {
      updatedAlarms = alarms.map(alarm => 
        alarm.id === alarmId ? storedAlarm : alarm
      );
    } else {
      updatedAlarms = [...alarms, storedAlarm];
    }

    await AsyncStorage.setItem('@alarms', JSON.stringify(updatedAlarms));
    return storedAlarm;
  } catch (error) {
    console.error('알람 저장 오류:', error);
    throw error;
  }
};

// 알람 삭제
export const deleteAlarm = async (alarmId: string): Promise<void> => {
  try {
    const alarms = await getStoredAlarms();
    const alarmToDelete = alarms.find(alarm => alarm.id === alarmId);
    
    if (alarmToDelete) {
      // 스케줄된 알림들 취소
      await cancelAlarm(alarmToDelete.notificationIds);
      
      // 저장된 알람 목록에서 제거
      const updatedAlarms = alarms.filter(alarm => alarm.id !== alarmId);
      await AsyncStorage.setItem('@alarms', JSON.stringify(updatedAlarms));
    }
  } catch (error) {
    console.error('알람 삭제 오류:', error);
    throw error;
  }
};

// 알람 토글 (활성화/비활성화)
export const toggleAlarm = async (alarmId: string, isActive: boolean): Promise<void> => {
  try {
    const alarms = await getStoredAlarms();
    const alarmIndex = alarms.findIndex(alarm => alarm.id === alarmId);
    
    if (alarmIndex === -1) return;
    
    const alarm = alarms[alarmIndex];
    
    if (isActive) {
      // 알람 활성화: 새로 스케줄링
      const notificationIds = await scheduleAlarm(alarm, alarmId);
      alarm.notificationIds = notificationIds;
    } else {
      // 알람 비활성화: 스케줄된 알림들 취소
      await cancelAlarm(alarm.notificationIds);
      alarm.notificationIds = [];
    }
    
    alarm.isActive = isActive;
    alarms[alarmIndex] = alarm;
    
    await AsyncStorage.setItem('@alarms', JSON.stringify(alarms));
  } catch (error) {
    console.error('알람 토글 오류:', error);
    throw error;
  }
};

// 앱 시작 시 알람 복원
export const restoreAlarms = async (): Promise<void> => {
  try {
    const alarms = await getStoredAlarms();
    const hasPermission = await requestNotificationPermissions();
    
    if (!hasPermission) return;

    // 모든 기존 스케줄 취소 후 재설정
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const updatedAlarms: StoredAlarmData[] = [];
    
    for (const alarm of alarms) {
      if (alarm.isActive) {
        try {
          // 일회성 알람의 경우 시간이 지났으면 비활성화
          if (alarm.selectedDays.length === 0) {
            const alarmTime = new Date(alarm.selectedTime);
            if (alarmTime <= new Date()) {
              alarm.isActive = false;
              alarm.notificationIds = [];
              updatedAlarms.push(alarm);
              continue;
            }
          }
          
          // 알람 재스케줄링
          const notificationIds = await scheduleAlarm(alarm, alarm.id);
          alarm.notificationIds = notificationIds;
        } catch (error) {
          console.error(`알람 복원 오류 (ID: ${alarm.id}):`, error);
          alarm.isActive = false;
          alarm.notificationIds = [];
        }
      }
      updatedAlarms.push(alarm);
    }
    
    await AsyncStorage.setItem('@alarms', JSON.stringify(updatedAlarms));
  } catch (error) {
    console.error('알람 복원 오류:', error);
  }
};

// 다음 알람 시간 계산 (표시용)
export const getNextAlarmTime = (alarmData: AlarmData): Date | null => {
  const { selectedTime, selectedDays } = alarmData;
  const now = new Date();
  
  if (selectedDays.length === 0) {
    // 일회성 알람
    return selectedTime > now ? selectedTime : null;
  }
  
  // 반복 알람 - 다음에 울릴 시간 계산
  const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ...
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const alarmTime = selectedTime.getHours() * 60 + selectedTime.getMinutes();
  
  const dayMap: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  
  const activeDays = selectedDays.map(day => dayMap[day]).sort((a, b) => a - b);
  
  // 오늘 알람이 남아있는지 확인
  if (activeDays.includes(currentDay) && currentTime < alarmTime) {
    const nextAlarm = new Date(now);
    nextAlarm.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    return nextAlarm;
  }
  
  // 다음 활성 요일 찾기
  let nextDay = currentDay + 1;
  let daysToAdd = 1;
  
  while (daysToAdd <= 7) {
    if (nextDay > 6) nextDay = 0;
    
    if (activeDays.includes(nextDay)) {
      const nextAlarm = new Date(now);
      nextAlarm.setDate(now.getDate() + daysToAdd);
      nextAlarm.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      return nextAlarm;
    }
    
    nextDay++;
    daysToAdd++;
  }
  
  return null;
};