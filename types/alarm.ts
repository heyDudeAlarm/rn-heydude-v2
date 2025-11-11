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

// 요일 목록과 라벨 매핑
export const DAYS_OF_WEEK: Array<{ key: DayOfWeek; label: string }> = [
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