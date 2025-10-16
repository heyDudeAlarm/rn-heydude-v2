import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { pickAndUploadAudio } from "../utils/audioUpload";

export default function App() {
  const [uploading, setUploading] = useState(false);
  const [uploadedAudios, setUploadedAudios] = useState<
    { url: string; fileName: string }[]
  >([]);

  const handleAudioUpload = async () => {
    try {
      setUploading(true);

      // 'audios'는 Supabase Storage의 버킷 이름입니다
      // 실제 버킷 이름으로 변경해주세요
      const result = await pickAndUploadAudio("audios", "uploads");

      if (result.error) {
        Alert.alert("업로드 실패", result.error.message);
        return;
      }

      if (!result.url) {
        // 사용자가 취소한 경우
        return;
      }

      // 업로드 성공
      setUploadedAudios((prev) => [
        ...prev,
        { url: result.url!, fileName: result.fileName || "audio.mp3" },
      ]);

      Alert.alert(
        "업로드 성공",
        `파일: ${result.fileName}\n크기: ${(
          (result.fileSize || 0) / 1024
        ).toFixed(2)} KB`,
        [{ text: "확인" }]
      );
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("오류", "업로드 중 문제가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Upload</Text>

      {/* 오디오 업로드 버튼 */}
      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={handleAudioUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>
            오디오 파일 업로드 (최대 2MB)
          </Text>
        )}
      </TouchableOpacity>

      {/* 업로드된 오디오 목록 */}
      {uploadedAudios.length > 0 && (
        <View style={styles.audioListContainer}>
          <Text style={styles.sectionTitle}>업로드된 오디오:</Text>
          {uploadedAudios.map((audio, index) => (
            <View key={index} style={styles.audioItem}>
              <Text style={styles.audioFileName} numberOfLines={1}>
                {audio.fileName}
              </Text>
              <Text style={styles.audioUrl} numberOfLines={1}>
                {audio.url}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  uploadButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  uploadButtonDisabled: {
    backgroundColor: "#ccc",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  audioListContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  audioItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  audioFileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  audioUrl: {
    fontSize: 12,
    color: "#007AFF",
  },
});
