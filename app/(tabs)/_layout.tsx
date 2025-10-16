import { Tabs } from 'expo-router'; // 네비게이션 컴포넌트
import React from 'react';

import { HapticTab } from '@/components/HapticTab'; // 커스텀 햄틱 피드백이 있는 탭 버튼 컴포넌트
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme'; // 다크/라이트 모드 감지 훅

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index" // index.tsx 파일 이름과 연결
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="alarm.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="record" // record.tsx 파일 이름과 연결
        options={{
          title: 'Record',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="mic.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
