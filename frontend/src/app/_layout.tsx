import "../../global.css";
import { Stack, ThemeProvider, DefaultTheme, useRouter, useSegments } from "expo-router";
import { useFarmNodeStore } from "@/store/farmNodeStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { getAllFarmNodes } from "@/services/farmNodeServices";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  // Auth store state
  const userId = useAuthStore((state) => state.userId);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Farm Node store state
  const setNodes = useFarmNodeStore((state) => state.setNodes);
  const setLoadingNodes = useFarmNodeStore((state) => state.setLoading);
  const initialized = useFarmNodeStore((state) => state.initialized);
  const setInitialized = useFarmNodeStore((state) => state.setInitialized);
  const nodes = useFarmNodeStore((state) => state.nodes);

  const { sendMessage } = useWebSocket(`${process.env.EXPO_PUBLIC_WEBSOCKET_SERVER}`);

  // 1. Check local storage for user auth on app boot
  useEffect(() => {
    checkAuth();
  }, []);

  // 2. Handle protection and redirection based on authentication
  useEffect(() => {
    if (isLoadingAuth) return;

    const inAuthGroup = (segments as string[])[0] === '(auth)';

    if (!userId && !inAuthGroup) {
      // Not logged in -> send to login page
      router.replace('/(auth)/authScreen' as never);
    } else if (userId && inAuthGroup) {
      // Logged in but sitting on auth screens -> send to main app index/tabs
      router.replace('/(tabs)');
    }
  }, [userId, isLoadingAuth, segments]);

  // 3. Initialize Farm Nodes data (Only fetch if user is logged in)
  useEffect(() => {
    if (!userId || initialized) return;

    let active = true;

    async function initialize() {
      setLoadingNodes(true);
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
          setLoadingNodes(false);
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [userId, initialized]);

  // 4. WebSocket node subscription management
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

  // Show a clean loading spinner while evaluating storage/auth state
  if (isLoadingAuth) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}