import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  pauseRecording,
  requestRecordingPermission,
  resumeRecording,
  startRecording,
  stopRecording,
} from "../../utils/audioRecording";
import { uploadFile } from "../../utils/storage";

type RecordStep = "recording" | "preview";

export default function AudioRecordScreen() {
  const [recordStep, setRecordStep] = useState<RecordStep>("recording");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 녹음 시간 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, isPaused]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // 녹음 시작/일시정지 토글
  const handleRecordToggle = async () => {
    try {
      if (!isRecording) {
        // 권한 확인
        const hasPermission = await requestRecordingPermission();
        if (!hasPermission) {
          Alert.alert("권한 필요", "오디오 녹음 권한이 필요합니다.");
          return;
        }

        // 녹음 시작
        const result = await startRecording();
        if (result.success) {
          setIsRecording(true);
          setIsPaused(false);
        } else {
          Alert.alert("오류", "녹음을 시작할 수 없습니다.");
        }
      } else {
        // 일시정지/재개
        if (isPaused) {
          const result = await resumeRecording();
          if (result.success) {
            setIsPaused(false);
          }
        } else {
          const result = await pauseRecording();
          if (result.success) {
            setIsPaused(true);
          }
        }
      }
    } catch (error) {
      console.error("Record toggle error:", error);
      Alert.alert("오류", "녹음 중 문제가 발생했습니다.");
    }
  };

  // 녹음 완료
  const handleStopRecording = async () => {
    try {
      const result = await stopRecording();

      if (result.success && result.result) {
        setRecordingUri(result.result.uri);
        setIsRecording(false);
        setIsPaused(false);
        setRecordStep("preview");
      } else {
        Alert.alert("오류", "녹음을 저장할 수 없습니다.");
      }
    } catch (error) {
      console.error("Stop recording error:", error);
      Alert.alert("오류", "녹음 저장 중 문제가 발생했습니다.");
    }
  };

  // 재녹음
  const handleReRecord = async () => {
    try {
      // 기존 사운드 정리
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // 녹음 파일 삭제
      if (recordingUri) {
        await FileSystem.deleteAsync(recordingUri, { idempotent: true });
      }

      setRecordStep("recording");
      setRecordingTime(0);
      setRecordingUri(null);
      setIsPlaying(false);
    } catch (error) {
      console.error("Re-record error:", error);
    }
  };

  // 미리보기 재생/일시정지
  const handlePlayPause = async () => {
    try {
      if (!recordingUri) return;

      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      } else {
        // 새로운 사운드 로드
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: true }
        );

        setSound(newSound);
        setIsPlaying(true);

        // 재생 완료 시 처리
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error("Play/Pause error:", error);
      Alert.alert("오류", "재생 중 문제가 발생했습니다.");
    }
  };

  // 음성 메시지 전송 (Supabase 업로드)
  const handleSendVoiceMessage = async () => {
    try {
      if (!recordingUri) {
        Alert.alert("오류", "녹음 파일이 없습니다.");
        return;
      }

      setUploading(true);

      // 파일 읽기
      const fileData = await FileSystem.readAsStringAsync(recordingUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Base64를 Blob으로 변환
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // 파일명 생성
      const timestamp = new Date().getTime();
      const fileName = `recording_${timestamp}.m4a`;

      // Supabase에 업로드
      const result = await uploadFile({
        bucket: "audios",
        path: `uploads/${fileName}`,
        file: byteArray,
        contentType: "audio/m4a",
      });

      if (result.error) {
        Alert.alert("업로드 실패", result.error.message);
        return;
      }

      // 로컬 파일 삭제
      await FileSystem.deleteAsync(recordingUri, { idempotent: true });

      Alert.alert("업로드 성공", "음성 메시지가 전송되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            // 초기화
            setRecordStep("recording");
            setRecordingTime(0);
            setRecordingUri(null);
            setIsPlaying(false);
            if (sound) {
              sound.unloadAsync();
              setSound(null);
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Send voice message error:", error);
      Alert.alert("오류", "음성 메시지 전송 중 문제가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // 시간 포맷 (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 미리보기 화면
  if (recordStep === "preview") {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Preview</Text>
            <Text style={styles.subtitle}>녹음된 음성 메시지</Text>

            {/* 재생 컨트롤 */}
            <View style={styles.previewCard}>
              <View style={styles.playControlRow}>
                <View style={styles.iconContainerSmall}>
                  <Text style={styles.iconTextSmall}>⏺️</Text>
                </View>

                <Text style={styles.timeDisplaySmall}>
                  {formatTime(recordingTime)}
                </Text>

                <TouchableOpacity
                  style={styles.playButtonSmall}
                  onPress={handlePlayPause}
                >
                  <Text style={styles.playButtonText}>
                    {isPlaying ? "⏸" : "▶"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 간단한 파형 표시 */}
              <View style={styles.waveformContainer}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        height: `${Math.random() * 50 + 20}%`,
                        backgroundColor: isPlaying ? "#4A90E2" : "#666",
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* 수신자 정보 (추후 구현) */}
            <View style={styles.recipientCard}>
              <View style={styles.recipientIcon}>
                <Text style={styles.recipientIconText}>👤</Text>
              </View>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>음성 메시지</Text>
                <Text style={styles.recipientDetail}>
                  녹음 시간: {formatTime(recordingTime)}
                </Text>
              </View>
            </View>

            {/* 액션 버튼 */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.sendButton, uploading && styles.buttonDisabled]}
                onPress={handleSendVoiceMessage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.sendButtonText}>
                      📤 음성 메시지 전송
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reRecordButton}
                onPress={handleReRecord}
                disabled={uploading}
              >
                <Text style={styles.reRecordButtonText}>재녹음</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 녹음 화면
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Record Message</Text>
            <Text style={styles.subtitle}>음성 메시지 녹음</Text>
          </View>

          <View style={styles.recordingSection}>
            {/* 녹음 버튼 */}
            <View
              style={[
                styles.recordButtonOuter,
                isRecording && !isPaused && styles.recordButtonOuterActive,
              ]}
            >
              <View
                style={[
                  styles.recordButtonInner,
                  isRecording && !isPaused && styles.recordButtonInnerActive,
                ]}
              >
                <Text style={styles.micIcon}>🎤</Text>
              </View>
            </View>

            {/* 시간 표시 */}
            <Text style={styles.timeDisplay}>{formatTime(recordingTime)}</Text>
            <Text style={styles.statusText}>
              {isRecording
                ? isPaused
                  ? "일시정지됨"
                  : "녹음 중..."
                : "탭하여 녹음 시작"}
            </Text>
          </View>

          {/* 컨트롤 버튼 */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isRecording && !isPaused && styles.controlButtonActive,
              ]}
              onPress={handleRecordToggle}
            >
              <Text style={styles.controlButtonText}>
                {isRecording ? (isPaused ? "▶" : "⏸") : "🎤"}
              </Text>
            </TouchableOpacity>

            {recordingTime > 0 && (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={handleStopRecording}
              >
                <Text style={styles.stopButtonText}>✓</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16213e",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "300",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "300",
  },
  recordingSection: {
    alignItems: "center",
    marginBottom: 64,
  },
  recordButtonOuter: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(71, 85, 105, 0.3)",
    borderWidth: 4,
    borderColor: "rgba(100, 116, 139, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  recordButtonOuterActive: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(239, 68, 68, 0.5)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(100, 116, 139, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordButtonInnerActive: {
    backgroundColor: "#ef4444",
  },
  micIcon: {
    fontSize: 40,
  },
  timeDisplay: {
    fontSize: 64,
    fontWeight: "200",
    color: "#fff",
    marginBottom: 16,
    fontVariant: ["tabular-nums"],
  },
  statusText: {
    fontSize: 18,
    color: "#94a3b8",
    fontWeight: "300",
  },
  controls: {
    flexDirection: "row",
    gap: 32,
    alignItems: "center",
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(71, 85, 105, 0.6)",
    borderWidth: 4,
    borderColor: "rgba(100, 116, 139, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  controlButtonText: {
    fontSize: 28,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    borderWidth: 4,
    borderColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  stopButtonText: {
    fontSize: 32,
    color: "#fff",
  },
  previewCard: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.4)",
    marginBottom: 20,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  playControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  iconContainerSmall: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(100, 116, 139, 0.6)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  iconTextSmall: {
    fontSize: 20,
  },
  timeDisplaySmall: {
    fontSize: 32,
    fontWeight: "200",
    color: "#fff",
    fontVariant: ["tabular-nums"],
    flex: 1,
    textAlign: "center",
  },
  playButtonSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(71, 85, 105, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(100, 116, 139, 0.6)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  iconText: {
    fontSize: 32,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(71, 85, 105, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 32,
  },
  playButtonText: {
    fontSize: 24,
    color: "#e2e8f0",
  },
  waveformContainer: {
    flexDirection: "row",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: "rgba(71, 85, 105, 0.4)",
    borderRadius: 12,
    paddingHorizontal: 12,
    width: "100%",
  },
  waveformBar: {
    width: 3,
    backgroundColor: "#666",
    borderRadius: 2,
  },
  recipientCard: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.4)",
    marginBottom: 20,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  recipientIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(100, 116, 139, 0.6)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  recipientIconText: {
    fontSize: 18,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "300",
    color: "#fff",
    marginBottom: 2,
  },
  recipientDetail: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "300",
  },
  actionButtons: {
    width: "100%",
    gap: 12,
  },
  sendButton: {
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "300",
  },
  reRecordButton: {
    backgroundColor: "rgba(71, 85, 105, 0.5)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.3)",
  },
  reRecordButtonText: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "300",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
