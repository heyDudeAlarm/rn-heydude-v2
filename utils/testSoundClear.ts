import { clearAllSoundFiles, getStorageSoundFiles } from './soundManager';

// 사운드 파일 삭제 테스트 함수
export const testClearSoundFiles = async () => {
  console.log('🧪 사운드 파일 삭제 테스트 시작...');
  
  try {
    // 삭제 전 파일 목록 확인
    console.log('📋 삭제 전 파일 목록 확인...');
    const beforeFiles = await getStorageSoundFiles();
    console.log('삭제 전 파일들:', beforeFiles);
    
    if (beforeFiles.length === 0) {
      console.log('ℹ️ 삭제할 파일이 없습니다.');
      return;
    }
    
    // 파일 삭제 실행
    console.log('🗑️ 파일 삭제 실행...');
    await clearAllSoundFiles();
    
    // 삭제 후 파일 목록 확인
    console.log('📋 삭제 후 파일 목록 확인...');
    const afterFiles = await getStorageSoundFiles();
    console.log('삭제 후 파일들:', afterFiles);
    
    if (afterFiles.length === 0) {
      console.log('🎉 파일 삭제 성공!');
    } else {
      console.log('⚠️ 일부 파일이 남아있습니다:', afterFiles);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
};