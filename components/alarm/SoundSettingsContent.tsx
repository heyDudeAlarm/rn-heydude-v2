import { IconSymbol } from '@/components/ui/IconSymbol';
import { getAvailableSoundOptions } from '@/constants/sounds';
import { useThemeColor } from '@/hooks/use-theme-color';
import { initializeSounds, previewSound, SoundType } from '@/utils/soundManager';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

interface SoundSettingsContentProps {
  selectedSound: string;
  onSave: (selectedSound: string) => void;
  onCancel: () => void;
}

export default function SoundSettingsContent({ selectedSound, onSave, onCancel }: SoundSettingsContentProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const [tempSelectedSound, setTempSelectedSound] = useState<string>(selectedSound);
  const [isInitialized, setIsInitialized] = useState(false);
  const [soundOptions, setSoundOptions] = useState<{ key: string; label: string }[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // 컴포넌트 마운트 시 사운드 초기화 및 옵션 로드
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // 1. 사운드 파일 초기화
        await initializeSounds();
        setIsInitialized(true);
        console.log('사운드 초기화 완료');
        
        // 2. 사용 가능한 사운드 옵션 로드
        const availableOptions = await getAvailableSoundOptions();
        setSoundOptions([...availableOptions]); // readonly 배열을 mutable 배열로 변환
        setIsLoadingOptions(false);
        console.log('사운드 옵션 로드 완료:', availableOptions);
        
      } catch (error) {
        console.error('사운드 초기화 실패:', error);
        setIsLoadingOptions(false);
        Alert.alert('오류', '사운드 파일을 초기화할 수 없습니다.');
      }
    };
    initializeComponent();
  }, []);

  React.useEffect(() => {
    setTempSelectedSound(selectedSound);
  }, [selectedSound]);

  const handleSoundSelect = (soundKey: string) => {
    setTempSelectedSound(soundKey);
    // 미리보기 재생 (선택과 동시에 재생)
    handleSoundPreview(soundKey as SoundType);
  };

  const handleSave = () => {
    onSave(tempSelectedSound);
  };

  const handleSoundPreview = async (soundType: SoundType) => {
    if (!isInitialized) {
      Alert.alert('알림', '사운드가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    try {
      await previewSound(soundType);
    } catch (error) {
      console.error('사운드 미리보기 실패:', error);
      Alert.alert('오류', '사운드를 재생할 수 없습니다.');
    }
  };

  const handleCancel = () => {
    setTempSelectedSound(selectedSound);
    onCancel();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* 헤더 */}
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          onPress={handleCancel} 
          style={[styles.cancelButton]}
          activeOpacity={0.3}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ThemedText style={[styles.headerButtonText, { color: tintColor }]}>취소</ThemedText>
        </TouchableOpacity>
        
        <ThemedText type="title" style={styles.centerTitle}>사운드</ThemedText>
        
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton]}
          activeOpacity={0.3}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ThemedText style={[styles.headerButtonText, { color: tintColor }]}>저장</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* 사운드 옵션들 */}
        <ThemedView style={styles.section}>
          {isLoadingOptions ? (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>사운드 옵션 로드 중...</ThemedText>
            </ThemedView>
          ) : (
            soundOptions.map((sound) => (
              <ThemedView key={sound.key} style={styles.optionRow}>
                <TouchableOpacity
                  style={styles.optionMainButton}
                  onPress={() => handleSoundSelect(sound.key)}
                >
                  <ThemedText style={styles.optionLabel}>{sound.label}</ThemedText>
                  {tempSelectedSound === sound.key && (
                    <IconSymbol 
                      size={20} 
                      name="checkmark" 
                      color={tintColor} 
                    />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => handleSoundPreview(sound.key as SoundType)}
                >
                  <ThemedText style={styles.previewButtonText}>🔊</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ))
          )}
        </ThemedView>

        {/* 선택된 사운드 미리보기 */}
        <ThemedView style={styles.previewSection}>
          <ThemedText style={styles.previewTitle}>
            선택됨: {soundOptions.find(s => s.key === tempSelectedSound)?.label || '레이더'}
          </ThemedText>
          {!isLoadingOptions && (
            <ThemedText style={styles.fileCountText}>
              총 {soundOptions.length}개의 사운드 파일
            </ThemedText>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    minWidth: 80,
    backgroundColor: 'red',
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    minWidth: 80,
    backgroundColor: 'green',
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySpace: {
    minWidth: 80,
  },
  centerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionMainButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  previewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    marginLeft: 12,
  },
  previewButtonText: {
    fontSize: 16,
  },
  previewSection: {
    margin: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fileCountText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});