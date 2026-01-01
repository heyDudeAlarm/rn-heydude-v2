import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { configureBackgroundAlarms, restoreAlarms } from "@/utils/alarmService";
import { cleanupNotificationListeners, setupNotificationListeners } from "@/utils/notificationListeners";
import { useEffect } from "react";

// React Native Blob polyfill
if (typeof global.Blob === "undefined") {
  global.Blob = class Blob {
    _data: any;
    type: string;

    constructor(parts: any[], options: { type?: string } = {}) {
      this._data = parts;
      this.type = options.type || "";
    }

    get size() {
      return this._data.reduce((acc: number, part: any) => {
        if (typeof part === "string") return acc + part.length;
        if (part instanceof ArrayBuffer) return acc + part.byteLength;
        return acc;
      }, 0);
    }

    async arrayBuffer() {
      // ArrayBuffer로 변환
      return this._data[0];
    }

    async text() {
      return this._data.join("");
    }
  } as any;
}

// 개발자 도구 로드
if (__DEV__) {
  require("@/utils/devTools");
}

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 앱 시작 시 알람 복원 및 알림 리스너 설정
  useEffect(() => {
    const initializeAlarms = async () => {
      try {
        // 백그라운드 알람 설정 초기화
        await configureBackgroundAlarms();
        
        // 기존 알람 복원
        await restoreAlarms();
      } catch (error) {
        console.error('알람 초기화 중 오류:', error);
      }
    };

    // 알림 리스너 설정
    const subscriptions = setupNotificationListeners();
    
    initializeAlarms();

    // 클린업 함수
    return () => {
      cleanupNotificationListeners(subscriptions);
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
