import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

export interface RecordingResult {
  uri: string;
  duration: number;
  size: number;
}

let recording: Audio.Recording | null = null;

/**
 * 오디오 녹음 권한 요청
 */
export async function requestRecordingPermission(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Permission request error:", error);
    return false;
  }
}

/**
 * 녹음 시작
 */
export async function startRecording(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 기존 녹음이 있으면 정리
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
    }

    // 오디오 모드 설정
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // 새 녹음 시작
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recording = newRecording;
    return { success: true };
  } catch (error) {
    console.error("Failed to start recording:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 녹음 일시정지
 */
export async function pauseRecording(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!recording) {
      return { success: false, error: "No active recording" };
    }

    await recording.pauseAsync();
    return { success: true };
  } catch (error) {
    console.error("Failed to pause recording:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 녹음 재개
 */
export async function resumeRecording(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!recording) {
      return { success: false, error: "No active recording" };
    }

    await recording.startAsync();
    return { success: true };
  } catch (error) {
    console.error("Failed to resume recording:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 녹음 중지 및 파일 저장
 */
export async function stopRecording(): Promise<{
  success: boolean;
  result?: RecordingResult;
  error?: string;
}> {
  try {
    if (!recording) {
      return { success: false, error: "No active recording" };
    }

    const status = await recording.getStatusAsync();
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    recording = null;

    // 오디오 모드 초기화
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    if (!uri) {
      return { success: false, error: "No recording URI" };
    }

    // 파일 정보 가져오기
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const size = fileInfo.exists && "size" in fileInfo ? fileInfo.size : 0;

    return {
      success: true,
      result: {
        uri,
        duration: status.durationMillis || 0,
        size,
      },
    };
  } catch (error) {
    console.error("Failed to stop recording:", error);
    recording = null;
    return { success: false, error: String(error) };
  }
}

/**
 * 녹음 취소 (파일 삭제)
 */
export async function cancelRecording(): Promise<void> {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recording = null;

      // 파일 삭제
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      // 오디오 모드 초기화
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    }
  } catch (error) {
    console.error("Failed to cancel recording:", error);
  }
}

/**
 * 현재 녹음 상태 가져오기
 */
export async function getRecordingStatus() {
  if (!recording) {
    return null;
  }

  try {
    return await recording.getStatusAsync();
  } catch (error) {
    console.error("Failed to get recording status:", error);
    return null;
  }
}
