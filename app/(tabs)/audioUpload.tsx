import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { pickAndUploadAudio } from "../../utils/audioUpload";
import { listFiles, deleteFile, getSignedUrl } from "../../utils/storage";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

export default function App() {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingFile, setPlayingFile] = useState<string | null>(null);

  // 스토리지 파일 목록 가져오기
  const loadStorageFiles = async () => {
    try {
      setLoading(true);
      const { files, error } = await listFiles("audios", "uploads");

      if (error) {
        console.error("파일 목록 로드 에러:", error);
        Alert.alert("오류", "파일 목록을 불러오는데 실패했습니다.");
        return;
      }

      if (files) {
        setStorageFiles(files as StorageFile[]);
      }
    } catch (error) {
      console.error("파일 목록 로드 예외:", error);
      Alert.alert("오류", "파일 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await loadStorageFiles();
  };

  // 컴포넌트 마운트 시 파일 목록 로드
  useEffect(() => {
    loadStorageFiles();

    // cleanup: 컴포넌트 언마운트 시 오디오 정리
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

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
      Alert.alert(
        "업로드 성공",
        `파일: ${result.fileName}\n크기: ${(
          (result.fileSize || 0) / 1024
        ).toFixed(2)} KB`,
        [{ text: "확인" }]
      );

      // 파일 목록 새로고침
      await loadStorageFiles();
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("오류", "업로드 중 문제가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // 오디오 재생/일시정지
  const handlePlayPause = async (fileName: string) => {
    try {
      // 같은 파일을 재생 중이면 일시정지/재생 토글
      if (playingFile === fileName && sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
          } else {
            await sound.playAsync();
          }
        }
        return;
      }

      // 기존 사운드 정리
      if (sound) {
        await sound.unloadAsync();
      }

      // 서명된 URL 가져오기 (1시간 유효)
      const { url: fileUrl, error } = await getSignedUrl(
        "audios",
        `uploads/${fileName}`,
        3600
      );

      if (error || !fileUrl) {
        console.error("URL 가져오기 에러:", error);
        Alert.alert("오류", "오디오 파일 URL을 가져올 수 없습니다.");
        return;
      }

      // 새로운 오디오 로드 및 재생
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingFile(fileName);

      // 재생 완료 시 처리
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingFile(null);
        }
      });
    } catch (error) {
      console.error("재생 에러:", error);
      Alert.alert("오류", "오디오 재생에 실패했습니다.");
    }
  };

  // 오디오 정지
  const handleStop = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingFile(null);
    }
  };

  // 파일 삭제
  const handleDelete = async (fileName: string) => {
    Alert.alert(
      "파일 삭제",
      `"${fileName}"을(를) 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await deleteFile("audios", [
                `uploads/${fileName}`,
              ]);

              if (error) {
                Alert.alert("오류", "파일 삭제에 실패했습니다.");
                return;
              }

              Alert.alert("성공", "파일이 삭제되었습니다.");
              await loadStorageFiles();
            } catch (error) {
              console.error("삭제 에러:", error);
              Alert.alert("오류", "파일 삭제 중 문제가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 파일 아이템 렌더링
  const renderFileItem = ({ item }: { item: StorageFile }) => {
    const isPlaying = playingFile === item.name;

    return (
      <View style={styles.fileItem}>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.fileSize}>
            {formatFileSize(item.metadata?.size || 0)}
          </Text>
        </View>

        <View style={styles.fileActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.playButton]}
            onPress={() => handlePlayPause(item.name)}
          >
            <Text style={styles.actionButtonText}>
              {isPlaying ? "⏸" : "▶"}
            </Text>
          </TouchableOpacity>

          {isPlaying && (
            <TouchableOpacity
              style={[styles.actionButton, styles.stopButton]}
              onPress={handleStop}
            >
              <Text style={styles.actionButtonText}>⏹</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.name)}
          >
            <Text style={styles.actionButtonText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Upload</Text>
      {/* TODO 인증된 사용자만 업로드 하도록 후에 수정 */}
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
            오디오 파일 업로드 (최대 5MB)
          </Text>
        )}
      </TouchableOpacity>

      {/* 스토리지 파일 목록 */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          스토리지 파일 목록 ({storageFiles.length})
        </Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : storageFiles.length === 0 ? (
          <Text style={styles.emptyText}>업로드된 파일이 없습니다.</Text>
        ) : (
          <FlatList
            data={storageFiles}
            renderItem={renderFileItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
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
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
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
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 40,
  },
  listContent: {
    paddingBottom: 20,
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: "#666",
  },
  fileActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    backgroundColor: "#007AFF",
  },
  stopButton: {
    backgroundColor: "#FF9500",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#fff",
  },
});
