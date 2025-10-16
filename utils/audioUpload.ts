import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { uploadFile } from "./storage";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

export interface AudioUploadResult {
  url: string | null;
  path: string | null;
  error: Error | null;
  fileName?: string;
  fileSize?: number;
  duration?: number;
}

/**
 * 오디오 파일 크기 검증
 */
function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 오디오 파일을 선택하고 Supabase Storage에 업로드
 */
export async function pickAndUploadAudio(
  bucket: string,
  folder: string = ""
): Promise<AudioUploadResult> {
  try {
    // 오디오 파일 선택
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return { url: null, path: null, error: null };
    }

    const file = result.assets[0];

    // 파일 크기 검증
    if (!validateFileSize(file.size)) {
      const error = new Error(
        `파일 크기가 너무 큽니다. 최대 2MB까지 업로드 가능합니다. (현재: ${formatFileSize(file.size)})`
      );
      return { url: null, path: null, error };
    }

    // 파일 확장자 추출
    const fileExtension = file.name.split(".").pop() || "mp3";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // URI를 Blob으로 변환
    const response = await fetch(file.uri);
    const blob = await response.blob();

    // MIME 타입 결정
    const mimeType = file.mimeType || "audio/mpeg";

    // Supabase Storage에 업로드
    const uploadResult = await uploadFile({
      bucket,
      path: filePath,
      file: blob,
      contentType: mimeType,
    });

    return {
      ...uploadResult,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error) {
    console.error("Pick and upload audio error:", error);
    return {
      url: null,
      path: null,
      error: error as Error,
    };
  }
}

/**
 * 오디오를 녹음하고 Supabase Storage에 업로드
 */
export async function recordAndUploadAudio(
  bucket: string,
  folder: string = ""
): Promise<AudioUploadResult> {
  try {
    // 권한 요청
    const permissionResult = await Audio.requestPermissionsAsync();

    if (permissionResult.status !== "granted") {
      throw new Error("마이크 접근 권한이 필요합니다.");
    }

    // 오디오 모드 설정
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // 녹음 시작
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    // 녹음 중...
    // (실제 사용 시에는 녹음 UI와 중지 버튼이 필요합니다)
    // 이 함수는 녹음 객체를 반환하도록 수정하거나,
    // 별도의 녹음 관리 함수를 만드는 것이 좋습니다.

    return {
      url: null,
      path: null,
      error: new Error(
        "이 함수는 녹음 시작만 합니다. 별도의 녹음 관리가 필요합니다."
      ),
    };
  } catch (error) {
    console.error("Record audio error:", error);
    return {
      url: null,
      path: null,
      error: error as Error,
    };
  }
}

/**
 * 녹음된 오디오 파일을 업로드
 */
export async function uploadRecordedAudio(
  recordingUri: string,
  bucket: string,
  folder: string = ""
): Promise<AudioUploadResult> {
  try {
    // URI에서 파일 정보 가져오기
    const fileInfo = await fetch(recordingUri);
    const blob = await fileInfo.blob();

    // 파일 크기 검증
    if (!validateFileSize(blob.size)) {
      const error = new Error(
        `녹음 파일이 너무 큽니다. 최대 2MB까지 업로드 가능합니다. (현재: ${formatFileSize(blob.size)})`
      );
      return { url: null, path: null, error };
    }

    // 파일명 생성
    const fileName = `recording-${Date.now()}.m4a`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Supabase Storage에 업로드
    const uploadResult = await uploadFile({
      bucket,
      path: filePath,
      file: blob,
      contentType: "audio/m4a",
    });

    return {
      ...uploadResult,
      fileName,
      fileSize: blob.size,
    };
  } catch (error) {
    console.error("Upload recorded audio error:", error);
    return {
      url: null,
      path: null,
      error: error as Error,
    };
  }
}

/**
 * 여러 오디오 파일을 선택하고 Supabase Storage에 업로드
 */
export async function pickMultipleAudiosAndUpload(
  bucket: string,
  folder: string = ""
) {
  try {
    // 여러 오디오 파일 선택
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*"],
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (result.canceled) {
      return { uploads: [], errors: [], skipped: [] };
    }

    const uploads: AudioUploadResult[] = [];
    const errors: { fileName: string; error: Error }[] = [];
    const skipped: { fileName: string; reason: string }[] = [];

    // 각 파일 처리
    for (const file of result.assets) {
      // 파일 크기 검증
      if (!validateFileSize(file.size)) {
        skipped.push({
          fileName: file.name,
          reason: `파일 크기 초과 (${formatFileSize(file.size)}, 최대 2MB)`,
        });
        continue;
      }

      try {
        const fileExtension = file.name.split(".").pop() || "mp3";
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const response = await fetch(file.uri);
        const blob = await response.blob();

        const uploadResult = await uploadFile({
          bucket,
          path: filePath,
          file: blob,
          contentType: file.mimeType || "audio/mpeg",
        });

        if (uploadResult.error) {
          errors.push({ fileName: file.name, error: uploadResult.error });
        } else {
          uploads.push({
            ...uploadResult,
            fileName: file.name,
            fileSize: file.size,
          });
        }
      } catch (error) {
        errors.push({ fileName: file.name, error: error as Error });
      }
    }

    return { uploads, errors, skipped };
  } catch (error) {
    console.error("Pick multiple audios error:", error);
    return {
      uploads: [],
      errors: [{ fileName: "unknown", error: error as Error }],
      skipped: [],
    };
  }
}
