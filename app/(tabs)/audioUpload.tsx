import { Audio } from "expo-av";
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useState } from "react";
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
import { pickAndUploadAudio } from "../../utils/audioUpload";
import { deleteFile, getSignedUrl, listFiles } from "../../utils/storage";

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
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

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
    Alert.alert("파일 삭제", `"${fileName}"을(를) 삭제하시겠습니까?`, [
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
    ]);
  };

  // 단일 파일 다운로드
  const handleDownload = async (fileName: string) => {
    try {
      setDownloadingFiles(prev => new Set(prev).add(fileName));
      
      // 로컬 사운드 디렉터리 경로
      const soundDirectory = `${FileSystem.documentDirectory}sounds/`;
      
      // 사운드 디렉터리 생성
      const dirInfo = await FileSystem.getInfoAsync(soundDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(soundDirectory, { intermediates: true });
      }
      
      // 서명된 URL 가져오기
      const { url: fileUrl, error } = await getSignedUrl(
        "audios",
        `uploads/${fileName}`,
        3600
      );
      
      if (error || !fileUrl) {
        console.error("URL 가져오기 에러:", error);
        Alert.alert("오류", "파일 URL을 가져올 수 없습니다.");
        return;
      }
      
      // 로컬 파일 경로
      const localFilePath = `${soundDirectory}${fileName}`;
      
      console.log(`🔄 다운로드 시작: ${fileName}`);
      console.log(`  - 원본 URL: ${fileUrl}`);
      console.log(`  - 저장 경로: ${localFilePath}`);
      console.log(`  - 사운드 디렉터리: ${soundDirectory}`);
      console.log(`  - FileSystem.documentDirectory: ${FileSystem.documentDirectory}`);
      
      // 파일 다운로드
      const downloadResult = await FileSystem.downloadAsync(fileUrl, localFilePath);
      
      console.log(`✅ 다운로드 완료:`, downloadResult);
      console.log(`  - 다운로드 결과 URI: ${downloadResult.uri}`);
      console.log(`  - 예상 경로와 일치: ${downloadResult.uri === localFilePath}`);
      
      // 다운로드 직후 디렉터리 내용 확인
      try {
        const filesInDir = await FileSystem.readDirectoryAsync(soundDirectory);
        console.log(`  - 다운로드 후 디렉터리 내 파일들: ${filesInDir}`);
        console.log(`  - 다운로드한 파일 존재 확인: ${filesInDir.includes(fileName)}`);
      } catch (dirReadError) {
        console.error('  - 디렉터리 읽기 실패:', dirReadError);
      }
      
      // 파일 저장 확인
      const savedFileInfo = await FileSystem.getInfoAsync(localFilePath);
      console.log(`  - 파일 존재 최종 확인: ${savedFileInfo.exists}`);
      console.log(`  - 파일 정보:`, savedFileInfo);
      if (savedFileInfo.exists) {
        // 다운로드 성공 후 즉시 사운드 로드 테스트
        console.log('🧪 다운로드 완료 후 즉시 사운드 로드 테스트...');
        
        Alert.alert(
          "다운로드 완료", 
          `"${fileName}" 파일이 로컬 스토리지에 저장되었습니다.\n\n경로: ${localFilePath}\n\n잠시 후 사운드 미리보기로 확인해보세요.`
        );
      } else {
        Alert.alert("오류", `파일 저장에 실패했습니다.\n\n예상 경로: ${localFilePath}\n실제 상태: 파일 없음`);
      }
      
    } catch (error) {
      console.error("다운로드 오류:", error);
      Alert.alert("오류", "다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    }
  };

  // 모든 파일 다운로드
  const handleDownloadAll = async () => {
    if (storageFiles.length === 0) {
      Alert.alert("알림", "다운로드할 파일이 없습니다.");
      return;
    }
    
    Alert.alert(
      "모든 파일 다운로드",
      `${storageFiles.length}개의 파일을 모두 로컬 스토리지에 다운로드하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "다운로드",
          onPress: async () => {
            let successCount = 0;
            let failCount = 0;
            
            for (const file of storageFiles) {
              try {
                console.log(`📥 다운로드 중: ${file.name} (${successCount + failCount + 1}/${storageFiles.length})`);
                await handleDownload(file.name);
                successCount++;
              } catch (error) {
                console.error(`❌ 다운로드 실패: ${file.name}`, error);
                failCount++;
              }
            }
            
            Alert.alert(
              "다운로드 완료",
              `성공: ${successCount}개\n실패: ${failCount}개`
            );
          }
        }
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
    const isDownloading = downloadingFiles.has(item.name);

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
            disabled={isDownloading}
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
            onPress={() => handleDownload(item.name)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>📥</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.name)}
            disabled={isDownloading}
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
      
      {storageFiles.length > 0 && (
        <TouchableOpacity
          style={[styles.downloadAllButton]}
          onPress={handleDownloadAll}
        >
          <Text style={styles.downloadAllButtonText}>
            📥 모든 파일 로컬에 다운로드 ({storageFiles.length}개)
          </Text>
        </TouchableOpacity>
      )}

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
  downloadAllButton: {
    backgroundColor: "#34C759",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  downloadAllButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#fff",
  },
});
