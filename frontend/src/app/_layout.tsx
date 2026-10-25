import { Stack, ThemeProvider, DefaultTheme } from "expo-router";
import "@/global.css";

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
      </Stack>
    </ThemeProvider>
  )
}