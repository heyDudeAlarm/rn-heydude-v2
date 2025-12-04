import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

// 사운드 타입 정의 - 이제 동적으로 처리
export type SoundType = string;

// 로컬 사운드 파일 경로
const soundDirectory = `${FileSystem.documentDirectory}sounds/`;

// 사운드 관리 클래스
class SoundManager {
  private static instance: SoundManager;
  private soundObjects: Map<string, Audio.Sound> = new Map();
  private currentAlarmSound: Audio.Sound | null = null;
  private alarmTimer: number | null = null;

  private constructor() {
    this.initializeAudio();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private async initializeAudio() {
    try {
      // 오디오 세션 설정 (백그라운드 재생 가능)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true, // 백그라운드에서도 재생 가능
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true, // 무음 모드에서도 재생
        shouldDuckAndroid: false,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('오디오 초기화 실패:', error);
    }
  }

  // 사운드 디렉터리 생성
  async createSoundDirectory() {
    try {
      console.log('📁 사운드 디렉터리 경로:', soundDirectory);
      const dirInfo = await FileSystem.getInfoAsync(soundDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(soundDirectory, { intermediates: true });
        console.log('✅ 사운드 디렉터리 생성됨:', soundDirectory);
      } else {
        console.log('📁 사운드 디렉터리 이미 존재함:', soundDirectory);
      }
    } catch (error) {
      console.error('❌ 사운드 디렉터리 생성 실패:', error);
    }
  }

  // 스토리지의 사운드 파일 목록 확인
  async getStorageSoundFiles(): Promise<string[]> {
    try {
      console.log('🔍 사운드 파일 검색 시작...');
      await this.createSoundDirectory();
      
      const dirInfo = await FileSystem.getInfoAsync(soundDirectory);
      if (!dirInfo.exists) {
        console.log('❌ 사운드 디렉터리가 없습니다:', soundDirectory);
        return [];
      }

      console.log('📂 디렉터리 읽기 중:', soundDirectory);
      const files = await FileSystem.readDirectoryAsync(soundDirectory);
      console.log('📄 전체 파일 목록:', files);
      
      const audioFiles = files.filter(file => 
        file.endsWith('.wav') || file.endsWith('.mp3') || file.endsWith('.m4a')
      );
      
      console.log('🎵 오디오 파일 필터링 결과:', audioFiles);
      audioFiles.forEach(file => {
        console.log('  - 파일 경로:', `${soundDirectory}${file}`);
      });
      
      return audioFiles;
    } catch (error) {
      console.error('❌ 사운드 파일 목록 가져오기 실패:', error);
      return [];
    }
  }

  // 사운드 파일 로드 - 스토리지에서 직접 로드
  async loadSound(soundType: SoundType): Promise<Audio.Sound | null> {
    try {
      console.log('🎵 사운드 로드 시도:', soundType);
      console.log('  - soundDirectory:', soundDirectory);
      
      // 디렉터리 존재 확인
      const dirInfo = await FileSystem.getInfoAsync(soundDirectory);
      console.log('  - 디렉터리 존재:', dirInfo.exists);
      
      if (!dirInfo.exists) {
        console.warn('❌ 사운드 디렉터리가 없습니다:', soundDirectory);
        return null;
      }

      let fileName: string;
      let filePath: string;
      
      // 확장자가 이미 있는 경우 그대로 사용
      if (soundType.includes('.')) {
        fileName = soundType;
        filePath = `${soundDirectory}${fileName}`;
      } else {
        // 확장자가 없는 경우 실제 존재하는 파일을 찾아서 사용
        const files = await FileSystem.readDirectoryAsync(soundDirectory);
        console.log('  - 디렉터리 내 파일들:', files);
        
        // 지원하는 확장자로 파일을 찾기
        const supportedExtensions = ['.wav', '.mp3', '.m4a'];
        let foundFile: string | null = null;
        
        for (const ext of supportedExtensions) {
          const testFileName = `${soundType}${ext}`;
          if (files.includes(testFileName)) {
            foundFile = testFileName;
            break;
          }
        }
        
        if (foundFile) {
          fileName = foundFile;
          filePath = `${soundDirectory}${fileName}`;
          console.log('  ✅ 파일 발견:', fileName);
        } else {
          console.warn(`❌ 지원하는 확장자로 파일을 찾을 수 없습니다: ${soundType}`);
          console.log('  - 찾은 확장자들:', supportedExtensions.map(ext => `${soundType}${ext}`));
          return null;
        }
      }
      
      console.log('  - 최종 fileName:', fileName);
      console.log('  - 최종 filePath:', filePath);
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      console.log('  - 파일 존재 여부:', fileInfo.exists);
      
      if (!fileInfo.exists) {
        console.warn(`❌ 사운드 파일이 없습니다: ${fileName} (${filePath})`);
        return null;
      }

      console.log('✅ 사운드 파일 발견, Audio.Sound 생성 중...');
      const { sound } = await Audio.Sound.createAsync(
        { uri: filePath },
        { shouldPlay: false, isLooping: false }
      );
      
      this.soundObjects.set(soundType, sound);
      console.log('✅ 사운드 로드 완료:', fileName);
      return sound;
    } catch (error) {
      console.error(`사운드 로드 실패: ${soundType}`, error);
      return null;
    }
  }

  // 알람 사운드 재생 (백그라운드에서도 동작)
  async playAlarmSound(soundType: SoundType, duration: number = 30000): Promise<void> {
    try {
      console.log('🔊 알람 사운드 재생 시도:', soundType);
      console.log('  - 재생 시간:', `${duration}ms`);
      
      // 기존 알람 사운드가 재생 중이면 중지
      await this.stopAlarmSound();

      let sound = this.soundObjects.get(soundType);
      if (!sound) {
        console.log('🔄 사운드 로드 필요:', soundType);
        const loadedSound = await this.loadSound(soundType);
        if (!loadedSound) {
          console.error('❌ 사운드를 로드할 수 없습니다:', soundType);
          return;
        }
        sound = loadedSound;
      } else {
        console.log('♾️ 사운드 캐시에서 사용:', soundType);
      }

      // 사운드를 반복 재생으로 설정
      await sound.setIsLoopingAsync(true);
      await sound.setVolumeAsync(1.0); // 최대 볼륨
      
      this.currentAlarmSound = sound;
      await sound.playAsync();
      
      console.log(`알람 사운드 재생 시작: ${soundType}`);

      // 지정된 시간 후 자동 중지 (타이머 관리)
      this.alarmTimer = setTimeout(async () => {
        console.log('알람 자동 중지 타이머 실행');
        await this.stopAlarmSound();
      }, duration);

    } catch (error) {
      console.error('알람 사운드 재생 실패:', error);
    }
  }

  // 알람 사운드 중지
  async stopAlarmSound(): Promise<void> {
    try {
      // 알람 타이머 정리
      if (this.alarmTimer) {
        clearTimeout(this.alarmTimer);
        this.alarmTimer = null;
        console.log('알람 타이머 정리됨');
      }

      // 현재 알람 사운드 중지
      if (this.currentAlarmSound) {
        await this.currentAlarmSound.stopAsync();
        await this.currentAlarmSound.unloadAsync();
        this.currentAlarmSound = null;
        console.log('현재 알람 사운드 중지됨');
      }

      // 모든 사운드 오브젝트 중지 (안전장치)
      for (const [key, sound] of this.soundObjects.entries()) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.stopAsync();
            console.log(`사운드 중지됨: ${key}`);
          }
        } catch (soundError) {
          console.warn(`사운드 중지 중 오류: ${key}`, soundError);
        }
      }

      console.log('모든 알람 사운드 중지 완료');
    } catch (error) {
      console.error('알람 사운드 중지 실패:', error);
    }
  }

  // 사운드 미리보기 (짧게 재생)
  async previewSound(soundType: SoundType): Promise<void> {
    try {
      console.log('🎧 사운드 미리보기 시도:', soundType);
      
      let sound = this.soundObjects.get(soundType);
      if (!sound) {
        console.log('🔄 미리보기용 사운드 로드 필요:', soundType);
        const loadedSound = await this.loadSound(soundType);
        console.log('  - 로드된 사운드 객체:', loadedSound);
        if (!loadedSound) {
          console.error('❌ 미리보기 사운드를 로드할 수 없습니다:', soundType);
          return;
        }
        sound = loadedSound;
      } else {
        console.log('♾️ 미리보기용 사운드 캐시에서 사용:', soundType);
      }

      console.log('▶️ 미리보기 재생 시작:', soundType);
      await sound.setIsLoopingAsync(false);
      await sound.setVolumeAsync(0.7);
      await sound.playAsync();
      
      // 3초 후 중지
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.setPositionAsync(0); // 처음으로 되돌리기
        } catch (error) {
          console.error('미리보기 사운드 중지 실패:', error);
        }
      }, 3000);

    } catch (error) {
      console.error('사운드 미리보기 실패:', error);
    }
  }

  // 저장된 사운드 파일 목록 가져오기
  async getStoredSounds(): Promise<string[]> {
    try {
      console.log('📁 저장된 사운드 목록 검색 중...');
      console.log('  - 검색 디렉터리:', soundDirectory);
      
      const dirInfo = await FileSystem.getInfoAsync(soundDirectory);
      if (!dirInfo.exists) {
        console.log('❌ 사운드 디렉터리가 존재하지 않음:', soundDirectory);
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(soundDirectory);
      console.log('📄 디렉터리의 전체 파일 목록:', files);
      
      const audioFiles = files.filter(file => 
        file.endsWith('.wav') || file.endsWith('.mp3') || file.endsWith('.m4a')
      );
      console.log('🎵 오디오 파일 필터링 결과:', audioFiles);
      
      audioFiles.forEach(file => {
        console.log(`  - 오디오 파일: ${soundDirectory}${file}`);
      });
      
      return audioFiles;
    } catch (error) {
      console.error('❌ 저장된 사운드 목록 가져오기 실패:', error);
      return [];
    }
  }

  // 사운드 타입을 파일 URI로 변환
  async getSoundURI(soundType: SoundType): Promise<string | null> {
    try {
      // 확장자가 이미 있는 경우 그대로 사용
      if (soundType.includes('.')) {
        const uri = `${soundDirectory}${soundType}`;
        console.log('🔗 사운드 URI 생성 (확장자 포함):', soundType, '->', uri);
        return uri;
      }
      
      // 확장자가 없는 경우 실제 존재하는 파일을 찾기
      const dirInfo = await FileSystem.getInfoAsync(soundDirectory);
      if (!dirInfo.exists) {
        console.warn('❌ 사운드 디렉터리가 없음:', soundDirectory);
        return null;
      }
      
      const files = await FileSystem.readDirectoryAsync(soundDirectory);
      const supportedExtensions = ['.wav', '.mp3', '.m4a'];
      
      for (const ext of supportedExtensions) {
        const testFileName = `${soundType}${ext}`;
        if (files.includes(testFileName)) {
          const uri = `${soundDirectory}${testFileName}`;
          console.log('🔗 사운드 URI 생성 (확장자 찾음):', soundType, '->', uri);
          return uri;
        }
      }
      
      console.warn(`❌ URI 생성 실패 - 파일을 찾을 수 없음: ${soundType}`);
      return null;
    } catch (error) {
      console.error('❌ getSoundURI 오류:', error);
      return null;
    }
  }

  // 사운드 디렉터리의 모든 파일 삭제
  async clearAllSoundFiles(): Promise<void> {
    try {
      console.log('🗑️ 사운드 디렉터리 모든 파일 삭제 시작...');
      console.log('📁 대상 디렉터리:', soundDirectory);
      
      // 먼저 모든 사운드 완전히 중지 및 언로드
      console.log('🛑 모든 사운드 중지 중...');
      await this.stopAlarmSound();
      
      // 모든 사운드 객체 강제 언로드
      for (const [key, sound] of this.soundObjects.entries()) {
        try {
          console.log('🔄 사운드 언로드 중:', key);
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await sound.stopAsync();
            }
            await sound.unloadAsync();
          }
        } catch (unloadError) {
          console.warn('⚠️ 사운드 언로드 중 오류:', key, unloadError);
        }
      }
      this.soundObjects.clear();
      
      // 약간의 지연을 추가해서 파일 핸들이 완전히 해제되도록 함
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dirInfo = await FileSystem.getInfoAsync(soundDirectory);
      if (!dirInfo.exists) {
        console.log('ℹ️ 사운드 디렉터리가 존재하지 않습니다.');
        return;
      }

      const files = await FileSystem.readDirectoryAsync(soundDirectory);
      console.log('📋 삭제할 파일 목록:', files);

      if (files.length === 0) {
        console.log('ℹ️ 삭제할 파일이 없습니다.');
        return;
      }

      // 파일 하나씩 삭제 시도
      let deletedCount = 0;
      let failedCount = 0;

      for (const file of files) {
        const filePath = `${soundDirectory}${file}`;
        console.log('🗑️ 삭제 시도:', filePath);
        
        try {
          // 파일 정보 확인
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          console.log('📄 파일 정보:', {
            exists: fileInfo.exists,
            isDirectory: fileInfo.isDirectory,
            uri: fileInfo.uri
          });

          if (fileInfo.exists) {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
            
            // 삭제 확인
            const checkInfo = await FileSystem.getInfoAsync(filePath);
            if (!checkInfo.exists) {
              console.log('✅ 삭제 성공:', file);
              deletedCount++;
            } else {
              console.error('❌ 삭제 실패 (여전히 존재):', file);
              failedCount++;
            }
          } else {
            console.log('ℹ️ 파일이 이미 존재하지 않음:', file);
          }
        } catch (fileError) {
          console.error('❌ 파일 삭제 실패:', file, fileError);
          failedCount++;
          
          // 강제 삭제 시도
          try {
            console.log('🔨 강제 삭제 시도:', file);
            await FileSystem.deleteAsync(filePath, { idempotent: true });
            console.log('✅ 강제 삭제 성공:', file);
            deletedCount++;
          } catch (forceError) {
            console.error('❌ 강제 삭제도 실패:', file, forceError);
          }
        }
      }

      console.log('🧹 삭제 작업 완료');
      console.log(`✅ 성공: ${deletedCount}개, ❌ 실패: ${failedCount}개`);
      
      // 최종 확인
      try {
        const remainingFiles = await FileSystem.readDirectoryAsync(soundDirectory);
        console.log('📋 남은 파일:', remainingFiles);
        
        if (remainingFiles.length === 0) {
          console.log('🎉 모든 파일이 성공적으로 삭제되었습니다!');
        } else {
          console.warn('⚠️ 일부 파일이 남아있습니다:', remainingFiles);
        }
      } catch (checkError) {
        console.error('❌ 최종 확인 중 오류:', checkError);
      }
      
    } catch (error) {
      console.error('❌ 사운드 파일 삭제 중 치명적 오류:', error);
      throw error;
    }
  }

  // 모든 사운드 객체 정리
  async cleanup(): Promise<void> {
    try {
      await this.stopAlarmSound();
      
      for (const sound of this.soundObjects.values()) {
        await sound.unloadAsync();
      }
      this.soundObjects.clear();
    } catch (error) {
      console.error('사운드 정리 실패:', error);
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const soundManager = SoundManager.getInstance();

// 편의 함수들
export const initializeSounds = async () => {
  console.log('🔧 사운드 시스템 초기화 시작...');
  await soundManager.createSoundDirectory();
  console.log('✅ 사운드 시스템 초기화 완료');
};

export const getStorageSoundFiles = async () => {
  console.log('📋 스토리지 사운드 파일 목록 요청...');
  const files = await soundManager.getStorageSoundFiles();
  console.log(`📁 발견된 파일 개수: ${files.length}`);
  return files;
};

export const playAlarmSound = (soundType: SoundType, duration?: number) => {
  console.log('🎵 알람 사운드 재생 요청:', soundType);
  return soundManager.playAlarmSound(soundType, duration);
};

export const stopAlarmSound = () => {
  console.log('⏹️ 알람 사운드 중지 요청');
  return soundManager.stopAlarmSound();
};

export const previewSound = (soundType: SoundType) => {
  console.log('👂 사운드 미리보기 요청:', soundType);
  return soundManager.previewSound(soundType);
};

export const clearAllSoundFiles = async () => {
  console.log('🗑️ 모든 사운드 파일 삭제 요청');
  await soundManager.clearAllSoundFiles();
};
export const getSoundURI = (soundType: SoundType) => soundManager.getSoundURI(soundType);