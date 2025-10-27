import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
