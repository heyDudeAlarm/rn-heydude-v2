import * as FileSystemLegacy from "expo-file-system/legacy";
import { Alert } from "react-native";
import { getSignedUrl } from "./storage";

/**
 * 오디오 파일 다운로드 결과
 */
export interface DownloadResult {
  success: boolean;
  uri?: string;
  error?: string;
}

/**
 * Supabase Storage에서 오디오 파일 다운로드
 *
 * @param bucket - Supabase Storage 버킷 이름
 * @param filePath - 다운로드할 파일 경로 (예: "uploads/audio.m4a")
 * @param displayName - 사용자에게 표시할 파일명
 * @returns DownloadResult
 */
export async function downloadAudioFile(
  bucket: string,
  filePath: string,
  displayName: string
): Promise<DownloadResult> {
  try {
    // 1. Supabase에서 서명된 URL 가져오기
    const { url, error: urlError } = await getSignedUrl(
      bucket,
      filePath,
      3600 // 1시간 유효
    );

    if (urlError || !url) {
      console.error("서명된 URL 가져오기 실패:", urlError);
      return {
        success: false,
        error: "파일 URL을 가져올 수 없습니다.",
      };
    }

    // 2. 파일 확장자 추출
    const extension = filePath.substring(filePath.lastIndexOf("."));

    // 3. 저장할 로컬 파일명 생성
    const fileName = `${displayName}${extension}`;

    // 4. 저장할 로컬 경로 생성
    const localUri = `${FileSystemLegacy.documentDirectory}${fileName}`;

    // 5. 기존 파일이 있으면 삭제 (Legacy API 사용)
    const fileInfo = await FileSystemLegacy.getInfoAsync(localUri);
    if (fileInfo.exists) {
      await FileSystemLegacy.deleteAsync(localUri);
    }

    // 6. Legacy API의 downloadAsync를 사용하여 다운로드
    const downloadResult = await FileSystemLegacy.downloadAsync(url, localUri);

    if (downloadResult.status !== 200) {
      console.error("다운로드 실패:", downloadResult.status);
      return {
        success: false,
        error: `다운로드 실패 (상태 코드: ${downloadResult.status})`,
      };
    }

    // 7. 다운로드 성공
    console.log("파일 다운로드 완료:", downloadResult.uri);
    return {
      success: true,
      uri: downloadResult.uri,
    };
  } catch (error) {
    console.error("다운로드 중 예외 발생:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 다운로드된 오디오 파일 목록 가져오기
 *
 * @returns 다운로드된 파일 URI 배열
 */
export async function getDownloadedAudioFiles(): Promise<string[]> {
  try {
    // Legacy API를 사용하여 파일 목록 가져오기
    const directory = FileSystemLegacy.documentDirectory;
    if (!directory) {
      return [];
    }

    const files = await FileSystemLegacy.readDirectoryAsync(directory);

    // 오디오 파일만 필터링 (일반적인 오디오 확장자)
    const audioExtensions = [".m4a", ".mp3", ".wav", ".aac", ".opus"];
    const audioFiles = files.filter((file) =>
      audioExtensions.some((ext) => file.toLowerCase().endsWith(ext))
    );

    return audioFiles.map((file) => `${directory}${file}`);
  } catch (error) {
    console.error("다운로드된 파일 목록 가져오기 실패:", error);
    return [];
  }
}

/**
 * 다운로드된 오디오 파일 삭제
 *
 * @param fileName - 삭제할 파일명
 * @returns 성공 여부
 */
export async function deleteDownloadedAudioFile(
  fileName: string
): Promise<boolean> {
  try {
    const localUri = `${FileSystemLegacy.documentDirectory}${fileName}`;
    const fileInfo = await FileSystemLegacy.getInfoAsync(localUri);

    if (!fileInfo.exists) {
      console.warn("파일이 존재하지 않습니다:", fileName);
      return false;
    }

    await FileSystemLegacy.deleteAsync(localUri);
    console.log("파일 삭제 완료:", fileName);
    return true;
  } catch (error) {
    console.error("파일 삭제 실패:", error);
    return false;
  }
}

/**
 * 사용자에게 다운로드 확인 Alert 표시 후 다운로드 실행
 *
 * @param bucket - Supabase Storage 버킷 이름
 * @param filePath - 다운로드할 파일 경로
 * @param displayName - 사용자에게 표시할 파일명
 */
export async function downloadWithConfirmation(
  bucket: string,
  filePath: string,
  displayName: string
): Promise<void> {
  Alert.alert("파일 다운로드", `"${displayName}"을(를) 다운로드하시겠습니까?`, [
    {
      text: "취소",
      style: "cancel",
    },
    {
      text: "다운로드",
      onPress: async () => {
        const result = await downloadAudioFile(bucket, filePath, displayName);

        if (result.success) {
          Alert.alert(
            "다운로드 완료",
            `파일이 저장되었습니다.\n경로: ${result.uri}`,
            [{ text: "확인" }]
          );
        } else {
          Alert.alert("다운로드 실패", result.error || "알 수 없는 오류", [
            { text: "확인" },
          ]);
        }
      },
    },
  ]);
}
