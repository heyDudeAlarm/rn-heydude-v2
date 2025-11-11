import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '../common/ThemedText';
import { ThemedView } from '../common/ThemedView';
import { AlarmData } from './AddAlarmModal';
import AlarmListItem from './AlarmListItem';

export interface AlarmItem extends AlarmData {
  id: string;
  isEnabled: boolean;
}

interface AlarmListProps {
  alarms: AlarmItem[];
  onToggleAlarm: (id: string, enabled: boolean) => void;
  onEditAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
}

export default function AlarmList({ alarms, onToggleAlarm, onEditAlarm, onDeleteAlarm }: AlarmListProps) {
  if (alarms.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>설정된 알람이 없습니다</ThemedText>
        <ThemedText style={styles.emptySubText}>+ 버튼을 눌러 알람을 추가해보세요</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlarmListItem
            alarm={item}
            onToggle={onToggleAlarm}
            onEdit={onEditAlarm}
            onDelete={onDeleteAlarm}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  emptySubText: {
    fontSize: 14,
    opacity: 0.5,
  },
});