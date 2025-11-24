import { useThemeColor } from '@/hooks/use-theme-color';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

interface AlarmTimePickerProps {
  selectedTime: Date;
  onTimeChange: (time: Date) => void;
}

export default function AlarmTimePicker({ selectedTime, onTimeChange }: AlarmTimePickerProps) {
  const tintColor = useThemeColor({}, 'tint');
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
    }
    if (date) {
      // 초와 밀리초를 0으로 설정하여 정확히 00초에 울리도록 함
      const exactTime = new Date(date);
      exactTime.setSeconds(0, 0);
      onTimeChange(exactTime);
    }
  };

  return (
    <ThemedView style={styles.timePickerContainer}>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
          style={styles.iosTimePicker}
          textColor={tintColor}
        />
      ) : (
        <>
          <TouchableOpacity
            style={[styles.androidTimeButton, { borderColor: tintColor }]}
            onPress={() => setShowAndroidPicker(true)}
          >
            <ThemedText style={[styles.androidTimeButtonText, { color: tintColor }]}>
              {selectedTime.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </ThemedText>
          </TouchableOpacity>
          
          {showAndroidPicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  timePickerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iosTimePicker: {
    width: '100%',
    height: 200,
  },
  androidTimeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  androidTimeButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
});