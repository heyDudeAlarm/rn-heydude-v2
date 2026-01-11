import { useThemeColor } from '@/hooks/use-theme-color';
import { AlarmTime } from '@/types/alarm';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';

interface AlarmTimePickerProps {
  selectedTime: AlarmTime;
  onTimeChange: (time: AlarmTime) => void;
}

export default function AlarmTimePicker({ selectedTime, onTimeChange }: AlarmTimePickerProps) {
  const tintColor = useThemeColor({}, 'tint');
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  // AlarmTime을 Date 객체로 변환
  const getDateFromAlarmTime = (alarmTime: AlarmTime): Date => {
    const date = new Date();
    date.setHours(alarmTime.hours, alarmTime.minutes, 0, 0);
    return date;
  };

  // Date 객체를 AlarmTime으로 변환
  const getAlarmTimeFromDate = (date: Date): AlarmTime => {
    return {
      hours: date.getHours(),
      minutes: date.getMinutes()
    };
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
    }
    if (date) {
      onTimeChange(getAlarmTimeFromDate(date));
    }
  };

  return (
    <ThemedView style={styles.timePickerContainer}>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={getDateFromAlarmTime(selectedTime)}
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
              {String(selectedTime.hours).padStart(2, '0')}:{String(selectedTime.minutes).padStart(2, '0')}
            </ThemedText>
          </TouchableOpacity>
          
          {showAndroidPicker && (
            <DateTimePicker
              value={getDateFromAlarmTime(selectedTime)}
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