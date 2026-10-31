import "../../global.css";
import { Stack, ThemeProvider, DefaultTheme } from "expo-router";
import { useFarmNodeStore } from "@/store/farmNodeStore";
import { useEffect } from "react";
import { getAllFarmNodes } from "@/services/farmNodeServices";
import { useWebSocket } from "@/hooks/useWebSocket"; // Your custom hook

export default function RootLayout() {
  const setNodes = useFarmNodeStore((state) => state.setNodes);
  const setLoading = useFarmNodeStore((state) => state.setLoading);
  const initialized = useFarmNodeStore((state) => state.initialized);
  const setInitialized = useFarmNodeStore((state) => state.setInitialized);
  const nodes = useFarmNodeStore((state) => state.nodes);

  const { sendMessage } = useWebSocket(`${process.env.EXPO_PUBLIC_WEBSOCKET_SERVER}`);

  useEffect(() => {
    if (initialized) return;

    let active = true;

    async function initialize() {
      setLoading(true);

      try {
        const fetchedNodes = await getAllFarmNodes();
        if (active) {
          setNodes(fetchedNodes);
          setInitialized(true);
        }
      } catch (error) {
        console.error("Failed to load farm nodes:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [initialized]);

  useEffect(() => {
    if (initialized && nodes.length > 0) {
      const nodeIds = nodes.map((node) => node.node_id);
      console.log("_layout.tsx", nodeIds);

      sendMessage({
        action: "subscribe_nodes",
        nodeIds: nodeIds,
      });
    }
  }, [initialized, nodes]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}