import { useThemeColor } from '@/hooks/use-theme-color';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '../common/ThemedView';

type Props = PropsWithChildren<{
  showsVerticalScrollIndicator?: boolean;
}>;

export default function AlarmListView({
  children,
  showsVerticalScrollIndicator = true,
}: Props) {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollEventThrottle={16}
    >
      <ThemedView style={styles.content}>
        {children}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
});
