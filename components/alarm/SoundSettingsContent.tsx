import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

const SOUND_OPTIONS = [
  { key: 'radar', label: '레이더' },
  { key: 'classic', label: '클래식' },
  { key: 'bell', label: '벨' },
  { key: 'chime', label: '차임' },
  { key: 'digital', label: '디지털' },
  { key: 'horn', label: '호른' },
  { key: 'wave', label: '웨이브' },
  { key: 'marimba', label: '마림바' },
];

interface SoundSettingsContentProps {
  selectedSound: string;
  onSave: (selectedSound: string) => void;
  onCancel: () => void;
}

export default function SoundSettingsContent({ selectedSound, onSave, onCancel }: SoundSettingsContentProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const [tempSelectedSound, setTempSelectedSound] = useState<string>(selectedSound);

  React.useEffect(() => {
    setTempSelectedSound(selectedSound);
  }, [selectedSound]);

  const handleSoundSelect = (soundKey: string) => {
    setTempSelectedSound(soundKey);
    // 바로 저장하고 돌아가기 (사운드는 한 번 클릭으로 선택)
    onSave(soundKey);
  };

  const handleCancel = () => {
    console.log('🔥 Sound Cancel button pressed!');
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
        
        {/* 오른쪽 공간을 비워두기 위한 빈 뷰 */}
        <ThemedView style={styles.emptySpace} />
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* 사운드 옵션들 */}
        <ThemedView style={styles.section}>
          {SOUND_OPTIONS.map((sound) => (
            <TouchableOpacity
              key={sound.key}
              style={styles.optionRow}
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
          ))}
        </ThemedView>

        {/* 선택된 사운드 미리보기 */}
        <ThemedView style={styles.previewSection}>
          <ThemedText style={styles.previewTitle}>
            선택됨: {SOUND_OPTIONS.find(s => s.key === tempSelectedSound)?.label || '레이더'}
          </ThemedText>
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
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '400',
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
});