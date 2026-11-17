import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { Stack, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ESPProvPayload {
  ver: string;
  name: string;
  pop: string;
  transport: "ble" | "softap";
  username?: string;
}

export default function ESP32QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLightOn, setIsLightOn] = useState(false);
  const lastScannedRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  const handleScannedCode = useCallback((rawData: string) => {
    try {
      const payload: ESPProvPayload = JSON.parse(rawData);

      if (!payload.name || !payload.pop) {
        Alert.alert(
          "Invalid QR Code",
          "The QR code does not contain the required name and pop fields.",
        );
        setScanned(false);
        return;
      }

      setIsLightOn(false);
      router.push({
        pathname: "/Screens/wifiConfigScreen",
        params: {
          name: payload.name,
          pop: payload.pop,
          transport: payload.transport,
        },
      });
    } catch (error) {
      Alert.alert(
        "Scan Error",
        "The scanned QR code is not a valid ESP32 provisioning code (JSON format expected).",
      );
      setScanned(false);
    }
  }, []);

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      const now = Date.now();
      if (
        result.data === lastScannedRef.current &&
        now - lastScannedTimeRef.current < 2000
      ) {
        return;
      }
      lastScannedRef.current = result.data;
      lastScannedTimeRef.current = now;

      if (scanned) return;
      setScanned(true);
      handleScannedCode(result.data);
    },
    [scanned, handleScannedCode],
  );

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-zinc-700 text-base">
          Checking camera permission…
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-zinc-700 text-base text-center mb-4">
          Camera permission is required to scan the device QR code.
        </Text>
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-xl"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-black">
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
          enableTorch={isLightOn}
        />

        {/* Centered scan frame – camera preview is dark, so overlay stays light-on-dark */}
        <View
          className="absolute inset-0 items-center justify-center"
        >
          <View className="w-[260px] h-[260px] border-2 border-white rounded-[24px] bg-transparent" />

          <View className="absolute top-10 w-[90%] flex flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
            >
              <MaterialCommunityIcons name="close" size={25} color="black" />
            </TouchableOpacity>

            <Text className="text-xl font-semibold color-white">Scan Code</Text>

            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center z-50"
              onPress={() => {
                setIsLightOn(!isLightOn);
              }}
            >
              <MaterialCommunityIcons
                className="rotate-3"
                name="lightning-bolt"
                size={25}
                color="black"
              />

              {isLightOn ? (
                <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-[2px] border border-black bg-white rotate-45" />
              ) : (
                <></>
              )}
            </TouchableOpacity>
          </View>

          <View className="absolute bottom-20 bg-white/90 px-5 py-3 rounded-xl">
            <Text className="text-zinc-900 text-base text-center font-medium">
              Place the device QR code inside the frame
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}
