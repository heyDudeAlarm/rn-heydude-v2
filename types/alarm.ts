// 알람 관련 타입 정의
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export type PresetKey = 'never' | 'everyday' | 'weekdays' | 'weekends';

export interface AlarmData {
  selectedTime: Date;
  selectedDays: DayOfWeek[];
  repeatValue: string;
  labelValue: string;
  soundValue: string;
  snoozeValue: string;
}

// 저장된 알람 데이터 (ID와 상태 정보 포함)
export interface StoredAlarmData extends AlarmData {
  id: string;
  isActive: boolean;
  notificationIds: string[];
  createdAt: string;
}

// 요일 목록과 라벨 매핑
export const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'sunday', label: '일요일마다' },
  { key: 'monday', label: '월요일마다' },
  { key: 'tuesday', label: '화요일마다' },
  { key: 'wednesday', label: '수요일마다' },
  { key: 'thursday', label: '목요일마다' },
  { key: 'friday', label: '금요일마다' },
  { key: 'saturday', label: '토요일마다' },
];

// 프리셋 설정
export const REPEAT_PRESETS: Record<PresetKey, { label: string; days: DayOfWeek[] }> = {
  never: { label: '없음', days: [] },
  everyday: { label: '매일', days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
  weekdays: { label: '평일', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
  weekends: { label: '주말', days: ['saturday', 'sunday'] },
};

// 유틸리티 함수: 선택된 요일들을 표시용 텍스트로 변환
export const getRepeatDisplayText = (days: DayOfWeek[]): string => {
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