import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { uploadFile } from "./storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

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
  folder: string = "",
  customFileName?: string
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
    const fileSize = file.size || 0;
    if (!validateFileSize(fileSize)) {
      const error = new Error(
        `파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다. (현재: ${formatFileSize(
          fileSize
        )})`
      );
      return { url: null, path: null, error };
    }

    // 파일 확장자 추출
    const fileExtension = file.name.split(".").pop() || "mp3";

    // Base64 인코딩 함수 (파일명에 사용 가능한 URL-safe Base64)
    const encodeBase64UrlSafe = (str: string): string => {
      // React Native에서 한글 지원을 위해 encodeURIComponent + btoa 사용
      return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    };

    // 커스텀 파일명이 있으면 사용하고, 없으면 타임스탬프 기반 파일명 사용
    let fileName: string;
    let displayName: string; // UI에 표시할 이름 (한글 포함 가능)

    if (customFileName && customFileName.trim() !== "") {
      displayName = customFileName.trim();
      // 파일명 형식: [Base64인코딩된한글명]--[타임스탬프].확장자
      const encodedName = encodeBase64UrlSafe(displayName);
      const timestamp = Date.now();
      fileName = `${encodedName}--${timestamp}.${fileExtension}`;
    } else {
      // 자동 생성된 경우
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      fileName = `${timestamp}-${randomId}.${fileExtension}`;
      displayName = fileName;
    }

    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // MIME 타입 결정
    const mimeType = file.mimeType || "audio/mpeg";

    // React Native에서 fetch를 사용하여 파일을 ArrayBuffer로 읽기
    const response = await fetch(file.uri);
    const arrayBuffer = await response.arrayBuffer();

    // Supabase Storage에 업로드
    const uploadResult = await uploadFile({
      bucket,
      path: filePath,
      file: arrayBuffer,
      contentType: mimeType,
    });

    return {
      ...uploadResult,
      fileName,
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
    // fetch를 사용하여 파일을 ArrayBuffer로 읽기
    const response = await fetch(recordingUri);
    const arrayBuffer = await response.arrayBuffer();

    // 파일 크기 검증
    if (!validateFileSize(arrayBuffer.byteLength)) {
      const error = new Error(
        `녹음 파일이 너무 큽니다. 최대 5MB까지 업로드 가능합니다. (현재: ${formatFileSize(
          arrayBuffer.byteLength
        )})`
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
      file: arrayBuffer,
      contentType: "audio/m4a",
    });

    return {
      ...uploadResult,
      fileName,
      fileSize: arrayBuffer.byteLength,
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
      const fileSize = file.size || 0;

      // 파일 크기 검증
      if (!validateFileSize(fileSize)) {
        skipped.push({
          fileName: file.name,
          reason: `파일 크기 초과 (${formatFileSize(fileSize)}, 최대 5MB)`,
        });
        continue;
      }

      try {
        const fileExtension = file.name.split(".").pop() || "mp3";
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExtension}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // fetch를 사용하여 파일을 ArrayBuffer로 읽기
        const response = await fetch(file.uri);
        const arrayBuffer = await response.arrayBuffer();

        const uploadResult = await uploadFile({
          bucket,
          path: filePath,
          file: arrayBuffer,
          contentType: file.mimeType || "audio/mpeg",
        });

        if (uploadResult.error) {
          errors.push({ fileName: file.name, error: uploadResult.error });
        } else {
          uploads.push({
            ...uploadResult,
            fileName: file.name,
            fileSize,
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
