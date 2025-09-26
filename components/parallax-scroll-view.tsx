import { useThemeColor } from '@/hooks/use-theme-color';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from './themed-view';

type Props = PropsWithChildren<{
}>;

export default function ParallaxScrollView({
  children,
}: Props) {
  const backgroundColor = useThemeColor({ light: '#1D3D47', dark: '#1D3D47' }, 'background');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      scrollEventThrottle={16}>
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
