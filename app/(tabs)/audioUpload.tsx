import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { pickAndUploadAudio } from "../../utils/audioUpload";
import { deleteFile, getSignedUrl, listFiles } from "../../utils/storage";
import { downloadWithConfirmation } from "../../utils/audioDownload";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export default function App() {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingFile, setPlayingFile] = useState<string | null>(null);
  const [showFileNameModal, setShowFileNameModal] = useState(false);
  const [customFileName, setCustomFileName] = useState("");

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

  const handleAudioUpload = () => {
    // 파일명 입력 모달 표시
    setCustomFileName("");
    setShowFileNameModal(true);
  };

  const handleConfirmUpload = async () => {
    try {
      setShowFileNameModal(false);
      setUploading(true);

      // 'audios'는 Supabase Storage의 버킷 이름입니다
      const result = await pickAndUploadAudio(
        "audios",
        "uploads",
        customFileName.trim()
      );

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
  const handleDelete = async (item: StorageFile) => {
    const displayName = getDisplayName(item.name);

    Alert.alert("파일 삭제", `"${displayName}"을(를) 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await deleteFile("audios", [
              `uploads/${item.name}`,
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
    ]);
  };

  // 파일 다운로드
  const handleDownload = async (item: StorageFile) => {
    const displayName = getDisplayName(item.name);
    await downloadWithConfirmation("audios", `uploads/${item.name}`, displayName);
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 파일명에서 displayName 추출 함수
  const getDisplayName = (fileName: string): string => {
    try {
      // 파일명 형식: [Base64인코딩된한글명]--[타임스탬프].확장자
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));

      // '--'로 구분하여 Base64 부분과 타임스탬프 부분 분리
      const separatorIndex = nameWithoutExt.lastIndexOf("--");

      if (separatorIndex !== -1) {
        // '--' 구분자가 있으면 커스텀 파일명
        const encodedName = nameWithoutExt.substring(0, separatorIndex);
        const timestamp = nameWithoutExt.substring(separatorIndex + 2);

        // 타임스탬프가 숫자인지 확인
        if (/^\d+$/.test(timestamp)) {
          // URL-safe Base64를 일반 Base64로 변환
          const base64 = encodedName.replace(/-/g, "+").replace(/_/g, "/");

          // 패딩 추가
          const padded =
            base64 + "==".substring(0, (4 - (base64.length % 4)) % 4);

          // Base64 디코딩
          return decodeURIComponent(escape(atob(padded)));
        }
      }

      // 디코딩 실패 시 또는 자동 생성된 파일명인 경우 원본 반환
      return fileName;
    } catch (error) {
      console.error("파일명 디코딩 에러:", error);
      return fileName; // 디코딩 실패 시 원본 반환
    }
  };

  // 파일 아이템 렌더링
  const renderFileItem = ({ item }: { item: StorageFile }) => {
    const isPlaying = playingFile === item.name;

    // 파일명에서 displayName 추출
    const displayName = getDisplayName(item.name);

    return (
      <View style={styles.fileItem}>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {displayName}
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
            <Text style={styles.actionButtonText}>{isPlaying ? "⏸" : "▶"}</Text>
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
            style={[styles.actionButton, styles.downloadButton]}
            onPress={() => handleDownload(item)}
          >
            <Text style={styles.actionButtonText}>⬇️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
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

      {/* 파일명 입력 모달 */}
      <Modal
        visible={showFileNameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFileNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>파일명 설정</Text>
            <Text style={styles.modalDescription}>
              업로드할 파일명을 입력하세요 (확장자 제외)
            </Text>
            <Text style={styles.modalHint}>
              입력하지 않으면 자동으로 생성됩니다
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="예: 내 오디오 파일"
              placeholderTextColor="#999"
              value={customFileName}
              onChangeText={setCustomFileName}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowFileNameModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmUpload}
              >
                <Text style={styles.modalButtonTextConfirm}>업로드</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 스토리지 파일 목록 */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          스토리지 파일 목록 ({storageFiles.length})
        </Text>

        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={styles.loader}
          />
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
  downloadButton: {
    backgroundColor: "#34C759",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  modalHint: {
    fontSize: 12,
    color: "#999",
    marginBottom: 16,
    fontStyle: "italic",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f0f0f0",
  },
  modalButtonConfirm: {
    backgroundColor: "#007AFF",
  },
  modalButtonTextCancel: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextConfirm: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
