import { getAvailableSoundOptions } from '@/constants/sounds';
import { initializeSounds, playAlarmSound, previewSound, SoundType, stopAlarmSound } from '@/utils/soundManager';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SoundTestComponent() {
  const [soundOptions, setSoundOptions] = useState<{ key: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 사운드 옵션 로드
  useEffect(() => {
    const loadSoundOptions = async () => {
      try {
        const options = await getAvailableSoundOptions();
        setSoundOptions([...options]);
        setIsLoading(false);
      } catch (error) {
        console.error('사운드 옵션 로드 실패:', error);
        setIsLoading(false);
      }
    };
    loadSoundOptions();
  }, []);
  const handleInitialize = async () => {
    try {
      await initializeSounds();
      Alert.alert('성공', '사운드 파일이 초기화되었습니다.');
    } catch (error) {
      Alert.alert('오류', '사운드 초기화에 실패했습니다.');
      console.error(error);
    }
  };

  const handlePreview = async (soundType: SoundType) => {
    try {
      await previewSound(soundType);
      Alert.alert('재생', `${soundType} 사운드를 미리보기 중입니다. (3초간)`);
    } catch (error) {
      Alert.alert('오류', '사운드 재생에 실패했습니다.');
      console.error(error);
    }
  };

  const handleAlarmTest = async (soundType: SoundType) => {
    try {
      await playAlarmSound(soundType, 10000); // 10초간 재생
      Alert.alert('알람 테스트', `${soundType} 알람이 울리고 있습니다. (10초간)`);
    } catch (error) {
      Alert.alert('오류', '알람 재생에 실패했습니다.');
      console.error(error);
    }
  };

  const handleStopAlarm = async () => {
    try {
      await stopAlarmSound();
      Alert.alert('중지', '알람이 중지되었습니다.');
    } catch (error) {
      Alert.alert('오류', '알람 중지에 실패했습니다.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>사운드 테스트</Text>
      
      <TouchableOpacity style={styles.initButton} onPress={handleInitialize}>
        <Text style={styles.buttonText}>사운드 초기화</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.stopButton} onPress={handleStopAlarm}>
        <Text style={styles.buttonText}>알람 중지</Text>
      </TouchableOpacity>

      {isLoading ? (
        <Text style={styles.loadingText}>사운드 옵션 로드 중...</Text>
      ) : (
        <>
          <Text style={styles.subtitle}>미리보기 테스트 ({soundOptions.length}개 파일)</Text>
          {soundOptions.map((sound) => (
            <TouchableOpacity
              key={`preview-${sound.key}`}
              style={styles.soundButton}
              onPress={() => handlePreview(sound.key as SoundType)}
            >
              <Text style={styles.soundButtonText}>🔊 {sound.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.subtitle}>알람 테스트 (10초)</Text>
          {soundOptions.map((sound) => (
            <TouchableOpacity
              key={`alarm-${sound.key}`}
              style={styles.alarmButton}
              onPress={() => handleAlarmTest(sound.key as SoundType)}
            >
              <Text style={styles.soundButtonText}>⏰ {sound.label}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  initButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  soundButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  alarmButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  soundButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
});