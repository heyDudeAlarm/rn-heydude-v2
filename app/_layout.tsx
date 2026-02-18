import { supabase } from "@/utils/supabase";

import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";

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

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 요청 권한 획득 및 토큰 저장
    const setupPushNotifications = async () => {
      try {
        // Firebase Messaging 권한 요청
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          // 디바이스 토큰 획득
          const token = await messaging().getToken();
          console.log("Firebase Messaging Token:", token);

          // 현재 사용자 조회
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            // Supabase users 테이블에 토큰 저장
            const { error } = await supabase
              .from("users")
              .upsert({
                id: user.id,
                email: user.email,
                device_token: token,
              });

            if (error) {
              console.error("Error saving device token:", error);
            } else {
              console.log("Device token saved successfully");
            }
          }
        }
      } catch (error) {
        console.error("Error setting up push notifications:", error);
      }
    };

    setupPushNotifications();

    // 백그라운드 메시지 핸들러 (앱이 종료되었을 때도 처리)
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Background message received:", remoteMessage);
      // 백그라운드에서 메시지 처리
      // 예: 로컬 저장소에 저장, 동기화 등
    });

    // 포그라운드 메시지 핸들러
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log("Foreground message received:", remoteMessage);
      // 여기서 알림을 표시하거나 처리
    });

    // 알림 클릭 핸들러
    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        console.log("Notification opened app:", remoteMessage);
        // 앱이 백그라운드에서 알림으로 실행될 때 처리
      }
    );

    return () => {
      unsubscribeForeground();
      unsubscribeOnNotificationOpenedApp();
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
