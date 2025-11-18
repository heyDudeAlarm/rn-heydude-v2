import { supabase } from "./supabase";

export interface UploadOptions {
  bucket: string;
  path: string;
  file: Blob | File | ArrayBuffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, any>;
}

export interface UploadResult {
  url: string | null;
  path: string | null;
  error: Error | null;
}

/**
 * Supabase Storage에 파일 업로드
 */
export async function uploadFile({
  bucket,
  path,
  file,
  contentType,
  metadata,
}: UploadOptions): Promise<UploadResult> {
  try {
    const uploadOptions: any = {
      contentType,
      upsert: false,
    };

    // 메타데이터가 있으면 추가
    if (metadata) {
      uploadOptions.metadata = metadata;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, uploadOptions);

    if (error) {
      console.error("Upload error:", error);
      return { url: null, path: null, error };
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      error: null,
    };
  } catch (error) {
    console.error("Upload exception:", error);
    return {
      url: null,
      path: null,
      error: error as Error,
    };
  }
}

/**
 * Supabase Storage에서 파일 삭제
 */
export async function deleteFile(
  bucket: string,
  paths: string[]
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      console.error("Delete error:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Delete exception:", error);
    return { error: error as Error };
  }
}

/**
 * Supabase Storage에서 파일 목록 가져오기
 */
export async function listFiles(bucket: string, folder?: string) {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error("List error:", error);
      return { files: null, error };
    }

    return { files: data, error: null };
  } catch (error) {
    console.error("List exception:", error);
    return { files: null, error: error as Error };
  }
}

/**
 * Supabase Storage에서 파일 다운로드
 */
export async function downloadFile(bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      console.error("Download error:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Download exception:", error);
    return { data: null, error: error as Error };
  }
}

/**
 * 공개 URL 가져오기
 */
export function getPublicUrl(bucket: string, path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

/**
 * 서명된 URL 가져오기 (비공개 파일용)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Signed URL error:", error);
      return { url: null, error };
    }

    return { url: data.signedUrl, error: null };
  } catch (error) {
    console.error("Signed URL exception:", error);
    return { url: null, error: error as Error };
  }
}
