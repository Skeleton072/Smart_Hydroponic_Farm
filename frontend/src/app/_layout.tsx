import "../../global.css";
import { Stack, ThemeProvider, DefaultTheme } from "expo-router";
import { useFarmNodeStore } from "@/store/farmNodeStore";
import { useEffect } from "react";
import { getAllFarmNodes } from "@/services/farmNodeServices";

export default function RootLayout() {
  const setNodes = useFarmNodeStore((state) => state.setNodes);
  const setLoading = useFarmNodeStore((state) => state.setLoading);
  const initialized = useFarmNodeStore(
    (state) => state.initialized
  );
  const setInitialized = useFarmNodeStore(
    (state) => state.setInitialized
  );

  useEffect(() => {
    if (initialized) return;

    let active = true;

    async function initialize() {
      setLoading(true);

      try {
        const nodes = await getAllFarmNodes();
        if (active) {
          setNodes(nodes);
        }
      } catch (error) {
        console.error("Failed to load farm nodes:", error);
      } finally {
        if (active) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [initialized]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
      </Stack>
    </ThemeProvider>
  )
}