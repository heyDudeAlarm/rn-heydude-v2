import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { pickAndUploadAudio, pickMultipleAudiosAndUpload } from "@/utils/audioUpload";

export default function AudioUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleSingleAudioUpload = async () => {
    try {
      setUploading(true);

      // 'audio-files'는 Supabase Storage의 버킷 이름입니다
      // 'uploads'는 버킷 내의 폴더 경로입니다
      const result = await pickAndUploadAudio("audio-files", "uploads");

      if (result.error) {
        Alert.alert("업로드 실패", result.error.message);
        return;
      }

      if (result.url) {
        setUploadedUrl(result.url);
        Alert.alert(
          "업로드 성공",
          `파일: ${result.fileName}\n크기: ${(result.fileSize! / 1024).toFixed(2)} KB`
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("오류", "업로드 중 문제가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleAudioUpload = async () => {
    try {
      setUploading(true);

      const result = await pickMultipleAudiosAndUpload("audio-files", "uploads");

      // 결과 메시지 생성
      let message = "";
      if (result.uploads.length > 0) {
        message += `성공: ${result.uploads.length}개\n`;
      }
      if (result.errors.length > 0) {
        message += `실패: ${result.errors.length}개\n`;
      }
      if (result.skipped.length > 0) {
        message += `건너뜀: ${result.skipped.length}개\n`;
        result.skipped.forEach((item) => {
          message += `- ${item.fileName}: ${item.reason}\n`;
        });
      }

      Alert.alert("업로드 완료", message || "파일이 선택되지 않았습니다.");

      // 첫 번째 업로드된 파일의 URL 표시
      if (result.uploads.length > 0) {
        setUploadedUrl(result.uploads[0].url);
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("오류", "업로드 중 문제가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오디오 업로드</Text>
      <Text style={styles.subtitle}>최대 파일 크기: 2MB</Text>

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={handleSingleAudioUpload}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? "업로드 중..." : "오디오 파일 선택"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={handleMultipleAudioUpload}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? "업로드 중..." : "여러 파일 선택"}
        </Text>
      </TouchableOpacity>

      {uploadedUrl && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>업로드된 파일 URL:</Text>
          <Text style={styles.resultUrl} numberOfLines={2}>
            {uploadedUrl}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 200,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  resultContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  resultUrl: {
    fontSize: 12,
    color: "#007AFF",
  },
});
