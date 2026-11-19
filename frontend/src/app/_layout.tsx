import "../../global.css";
import {
  Stack,
  ThemeProvider,
  DefaultTheme,
  useRouter,
  useSegments,
} from "expo-router";
import { useFarmNodeStore } from "@/store/farmNodeStore";
// import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSensorStore } from "@/store/sensorStore";
import * as SecureStorage from "expo-secure-store";
import { authApi } from "@/api/authApi";
import { farmNodeApi } from "@/api/farmNodeApi";
import axios from "axios";

export default function RootLayout() {
  const router = useRouter();

  // Farm Node store state
  const setNodes = useFarmNodeStore((state) => state.setNodes);
  const setLoadingNodes = useFarmNodeStore((state) => state.setLoading);
  const initialized = useFarmNodeStore((state) => state.initialized);
  const setInitialized = useFarmNodeStore((state) => state.setInitialized);
  const nodes = useFarmNodeStore((state) => state.nodes);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sensor store state
  const setLoadingSensors = useSensorStore((state) => state.setLoading);

  // const { isConnected, sendMessage } = useWebSocket(
  //   `${process.env.EXPO_PUBLIC_WEBSOCKET_SERVER}`,
  // );

  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true);
        const refreshToken = await SecureStorage.getItemAsync("refreshToken");
        
        if (refreshToken == null) {
          router.replace("/(auth)/authScreen");
          return;
        }

        const { status, data } = await authApi.refresh({ refreshToken });
        if (status == 200) {
          setIsAuthenticated(true);
          await SecureStorage.setItemAsync("accessToken", data.accessToken);
          await SecureStorage.setItemAsync("refreshToken", data.refreshToken);

          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/authScreen");
        }
      } catch (error: any) {
        console.log("Error: ", error.message);
        router.replace("/(auth)/authScreen");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;

    async function initialize() {
      setLoadingNodes(true);
      setLoadingSensors(true);
      try {
        const fetchedNodes = await farmNodeApi.getAllFarmNodes();
        console.log("_layout.tsx: ", fetchedNodes);
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
  }, [isAuthenticated, initialized]);

  // useEffect(() => {
  //   if (isConnected && initialized && nodes.length > 0) {
  //     const nodeIds = nodes.map((node) => node.node_id);
  //     console.log("Re-subscribing nodes due to connect/reconnect:", nodeIds);

  //     sendMessage({
  //       action: "subscribe_nodes",
  //       nodeIds: nodeIds,
  //     });
  //   }
  // }, [isConnected, initialized, nodes]);

  // Show a clean loading spinner while evaluating storage/auth state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        {/* add authorization step to this screen */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
      </Stack>
    </ThemeProvider>
  );
}
