import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Linking,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ESPProvisionManager,
  ESPTransport,
  ESPSecurity,
} from "@orbital-systems/react-native-esp-idf-provisioning";
import { PermissionsAndroid } from "react-native";

// Optional Wi-Fi listing library. Wrapped so the app still builds/works on
// platforms where it's unavailable (iOS, or if not installed).
let WifiManager: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WifiManager = require("react-native-wifi-reborn").default;
} catch {
  WifiManager = null;
}

type WifiNetwork = {
  SSID: string;
  BSSID?: string;
  level?: number;
  security?: string;
};

// need to fix: when the password is incorrect, we should be able to restart provisioning without forcing ESP32 to reboot

export default function WiFiConfigScreen() {
  const router = useRouter();
  const { name, pop, transport } = useLocalSearchParams<{
    name: string;
    pop: string;
    transport: "ble" | "softap";
  }>();

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(false);
  const [networksError, setNetworksError] = useState<string | null>(null);

  // ---------- Wi-Fi network discovery ----------
  const loadNetworks = useCallback(async () => {
    if (!WifiManager) {
      setNetworksError(
        "Wi-Fi scanning isn't available on this build. Enter the network details manually."
      );
      return;
    }
    setIsLoadingNetworks(true);
    setNetworksError(null);
    try {
      const granted = await WifiManager.isEnabled();
      if (!granted) {
        setNetworksError("Please enable Wi-Fi to list nearby networks.");
        return;
      }
      // Android 6+: location permission is required to scan Wi-Fi
      if (Platform.OS === "android") {
        const { PermissionsAndroid } = require("react-native");
        const ok = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (ok !== PermissionsAndroid.RESULTS.GRANTED) {
          setNetworksError(
            "Location permission is required to scan Wi-Fi networks."
          );
          return;
        }
      }
      const list: WifiNetwork[] = await WifiManager.reScanAndLoadWifiList();
      // Dedupe by SSID, keep strongest signal, drop empty SSIDs
      const map = new Map<string, WifiNetwork>();
      for (const n of list) {
        if (!n.SSID) continue;
        const existing = map.get(n.SSID);
        if (!existing || (n.level ?? -999) > (existing.level ?? -999)) {
          map.set(n.SSID, n);
        }
      }
      const cleaned = Array.from(map.values()).sort(
        (a, b) => (b.level ?? -999) - (a.level ?? -999)
      );
      setNetworks(cleaned);

      // Pre-fill the currently connected network's SSID (handy default)
      try {
        const current = await WifiManager.getCurrentWifiSSID();
        if (current && !ssid) setSsid(current);
      } catch {
        /* ignore */
      }
    } catch (e: any) {
      setNetworksError(e?.message || "Failed to load Wi-Fi networks.");
    } finally {
      setIsLoadingNetworks(false);
    }
  }, [ssid]);

  useEffect(() => {
    loadNetworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectNetwork = (n: WifiNetwork) => {
    setSsid(n.SSID);
    // We can't read the saved password from the OS, so clear it and let the
    // user type it. (Some libraries expose a saved-network password on rooted
    // devices only – not worth relying on.)
    setPassword("");
  };

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== "android") return true;

    try {
      const permissions: Array<
        (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS]
      > = [];

      // Android 12 (API 31) and newer
      if (Number(Platform.Version) >= 31) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
      }

      // Required by the provisioning library's permission check
      permissions.push(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      const results = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = permissions.every(
        (permission) =>
          results[permission] === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        Alert.alert(
          "Permissions Required",
          "Bluetooth and location permissions are required to discover and provision your ESP32. Please grant the requested permissions in Settings."
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Bluetooth permission error:", error);
      return false;
    }
  };


  // ---------- Provisioning ----------
  const handleSubmit = async () => {
    if (!name || !pop) {
      Alert.alert("Missing Device Info", "Please scan the device QR code again.");
      return;
    }
    if (!ssid.trim()) {
      Alert.alert("Missing SSID", "Please choose or enter a network name.");
      return;
    }

    setIsSubmitting(true);
    let targetDevice: any = null;

    try {
      const resolvedTransport = transport === "softap" ? ESPTransport.softap : ESPTransport.ble;

      // Request Bluetooth permissions before BLE provisioning
      if (resolvedTransport === ESPTransport.ble) {
        const granted = await requestBluetoothPermissions();

        if (!granted) {
          return;
        }
      }

      const devices = await ESPProvisionManager.searchESPDevices(
        name,
        resolvedTransport,
        ESPSecurity.secure
      );

      if (!devices || devices.length === 0) {
        throw new Error(
          "ESP32 device not found nearby. Make sure Bluetooth/Wi-Fi is on and the device is powered."
        );
      }

      targetDevice = devices[0];
      await targetDevice.connect(pop);
      
      try {
        await targetDevice.provision(ssid.trim(), password);
        router.replace("/Screens/modifyNodeScreen");
      } catch (e: any) {
        console.log("incorrect password.");
      }
    } catch (error: any) {
      if (error?.message === "TIMEOUT") {
        Alert.alert(
          "Connection Timed Out",
          "The device could not connect to the Wi-Fi network. Please check the SSID and password and try again."
        );
      } else {
        Alert.alert(
          "Provisioning Failed",
          error?.message || "An unknown error occurred."
        );
      }
    } finally {
      if (targetDevice) {
        try {
          await targetDevice.disconnect();
        } catch {
          /* ignore */
        }
      }
      setIsSubmitting(false);
    }
  };

  // ---------- Render ----------
  const renderNetwork = ({ item }: { item: WifiNetwork }) => {
    const isSelected = item.SSID === ssid;
    return (
      <TouchableOpacity
        onPress={() => selectNetwork(item)}
        disabled={isSubmitting}
        className={`flex-row items-center justify-between px-4 py-3 mb-2 rounded-xl border ${
          isSelected
            ? "bg-blue-50 border-blue-500"
            : "bg-white border-zinc-200"
        }`}
      >
        <View className="flex-1 mr-3">
          <Text className="text-zinc-900 font-medium" numberOfLines={1}>
            {item.SSID}
          </Text>
          {!!item.security && item.security !== "OPEN" && (
            <Text className="text-zinc-500 text-xs mt-0.5">🔒 Secured</Text>
          )}
        </View>
        {typeof item.level === "number" && (
          <Text className="text-zinc-500 text-xs">
            {item.level > -55 ? "📶 Strong" : item.level > -70 ? "📶 OK" : "📶 Weak"}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Keyboard is not avoiding the view
  return (
    <>
      <Stack.Screen options={{ headerShown: false }}/>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-zinc-50"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isLoadingNetworks} onRefresh={loadNetworks} />
          }
        >
          <View className="px-6 pt-6">
            <Text className="text-zinc-900 text-2xl font-bold mb-1">
              Connect to Wi-Fi
            </Text>
            <Text className="text-zinc-500 text-sm mb-6">
              Configuring device:{" "}
              <Text className="text-zinc-900 font-semibold">
                {name || "Unknown"}
              </Text>
            </Text>

            {/* ---------- Nearby networks ---------- */}
            <Text className="text-zinc-800 text-sm font-semibold mb-2">
              Nearby Networks
            </Text>

            {isLoadingNetworks && networks.length === 0 ? (
              <View className="py-6 items-center">
                <ActivityIndicator color="#2563eb" />
                <Text className="text-zinc-500 text-sm mt-2">Scanning…</Text>
              </View>
            ) : networksError ? (
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <Text className="text-amber-800 text-sm">{networksError}</Text>
                <TouchableOpacity onPress={loadNetworks} className="mt-2 self-start">
                  <Text className="text-blue-600 font-medium text-sm">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : networks.length === 0 ? (
              <View className="bg-white border border-zinc-200 rounded-xl p-4 mb-6">
                <Text className="text-zinc-500 text-sm">
                  No networks found. Pull to refresh, or enter details manually below.
                </Text>
              </View>
            ) : (
              <View className="mb-6">
                <FlatList
                  data={networks}
                  keyExtractor={(n) => n.BSSID || n.SSID}
                  renderItem={renderNetwork}
                  scrollEnabled={false} // parent ScrollView handles scrolling
                />
              </View>
            )}

            {/* ---------- Manual entry ---------- */}
            <Text className="text-zinc-800 text-sm font-semibold mb-3 mt-2">
              Or enter manually
            </Text>

            <View className="mb-4">
              <Text className="text-zinc-600 text-sm font-medium mb-2">
                Network Name (SSID)
              </Text>
              <TextInput
                className="bg-white border border-zinc-300 text-zinc-900 px-4 py-4 rounded-xl text-base"
                placeholder="e.g. MyHomeWiFi"
                placeholderTextColor="#a1a1aa"
                value={ssid}
                onChangeText={setSsid}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
            </View>

            <View className="mb-6">
              <Text className="text-zinc-600 text-sm font-medium mb-2">
                Password
              </Text>
              <View className="relative justify-center">
                <TextInput
                  className="bg-white border border-zinc-300 text-zinc-900 px-4 py-4 rounded-xl text-base pr-16"
                  placeholder="Enter network password"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  className="absolute right-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text className="text-blue-600 font-medium">
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky footer button */}
        <View className="px-6 pb-8 pt-3 bg-zinc-50">
          <TouchableOpacity
            className={`py-4 rounded-xl items-center justify-center ${
              isSubmitting ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"
            }`}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Send Credentials
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}