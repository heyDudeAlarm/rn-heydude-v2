import { getStorageSoundFiles } from '@/utils/soundManager';

// 사운드 타입 정의 - 이제 동적으로 처리
export type SoundType = string;

// 기본 사운드 옵션 (fallback) - 사운드 파일이 없을 때만 사용
export const DEFAULT_SOUND_OPTIONS = [
  { key: 'default', label: '기본 알람음' },
] as const;

// 동적으로 사운드 옵션 가져오기 - 이제 soundManager를 통해서만
export async function getAvailableSoundOptions() {
  try {
    // soundManager의 getStorageSoundFiles를 사용
    const audioFiles = await getStorageSoundFiles();

    console.log('발견된 사운드 파일들:', audioFiles);

    if (audioFiles.length === 0) {
      console.log('사운드 파일이 없습니다. 기본 옵션 사용');
      return DEFAULT_SOUND_OPTIONS;
    }

    // 파일명을 옵션으로 변환 (실제 파일명 사용)
    const soundOptions = audioFiles.map(fileName => {
      const key = fileName.split('.')[0]; // 확장자 제거
      const label = fileName; // 실제 파일명 전체를 레이블로 사용
      
      return { key, label };
    });

    console.log('생성된 사운드 옵션:', soundOptions);
    return soundOptions;

  } catch (error) {
    console.error('사운드 옵션 가져오기 실패:', error);
    return DEFAULT_SOUND_OPTIONS;
  }
}

// 기본 export (호환성 유지)
export const SOUND_OPTIONS = DEFAULT_SOUND_OPTIONS;
export type SoundOptionType = typeof SOUND_OPTIONS[number];