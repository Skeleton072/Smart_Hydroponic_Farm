import "../../global.css";
import { Stack, ThemeProvider, DefaultTheme } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
      </Stack>
    </ThemeProvider>
  )
}