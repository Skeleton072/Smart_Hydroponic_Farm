import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

const INITIAL_SENSORS = [
  {
    id: "temp",
    label: "Temperature (°C)",
    minKey: "min_temperature",
    maxKey: "max_temperature",
  },
  {
    id: "humidity",
    label: "Humidity (%)",
    minKey: "min_humidity",
    maxKey: "max_humidity",
  },
  { id: "ph", label: "pH (%)", minKey: "min_pH", maxKey: "max_pH" },
  { id: "tds", label: "TDS", minKey: "min_tds", maxKey: "max_tds" },
] as const;

interface FarmNodeTypes {
  node_name: string;
  min_temperature: string;
  min_humidity: string;
  min_pH: string;
  min_tds: string;
  max_temperature: string;
  max_humidity: string;
  max_pH: string;
  max_tds: string;
}

export default function FarmNodeForm() {
  const router = useRouter();
  const [nodeName, setNodeName] = useState("");
  const [nodeImage, setNodeImage] = useState(null);

  // Sensor threshold states
  const [thresholds, setThresholds] = useState({
    min_temperature: "",
    min_humidity: "",
    min_pH: "",
    min_tds: "",
    max_temperature: "",
    max_humidity: "",
    max_pH: "",
    max_tds: "",
  });

  const handleThresholdChange = (key: string, value: string) => {
    setThresholds((prev) => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "Permission to access camera roll is required!",
      );
      return;
    }

    const result: any = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNodeImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!nodeName.trim()) {
      Alert.alert("Error", "Please enter a node name.");
      return;
    }

    const formData: FarmNodeTypes = {
      node_name: nodeName,
      ...thresholds,
    };

    console.log(formData);

    const status = await addNewNodeFunction(formData);

    if (status == 200) {
      router.back();
    }
  };

  async function addNewNodeFunction(formData: FarmNodeTypes) {
    try {
      const res = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER}:3000/api/node/addNewNode`,
        formData,
      );

      console.log("Response data: ", res.data);
      console.log("Response status: ", res.status);

      return res.status;
    } catch (error: any) {
      console.log(error.message);
      return;
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        className="flex-1 bg-gray-50"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-4 bg-background"
          contentContainerStyle={{
            paddingTop: 24,
            paddingBottom: 140,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          <View className="mt-6 mb-2 flex flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-main">
              Add New Farm Node
            </Text>

            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface w-12 h-12 rounded-full flex items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#2D3748" />
            </TouchableOpacity>
          </View>

          {/* Node Details Section */}
          <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Node Details
            </Text>

            {/* Node Name Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Node Name
              </Text>
              <TextInput
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-muted focus:border-emerald-600"
                placeholder="e.g., North Sector - Greenhouse 1"
                value={nodeName}
                onChangeText={setNodeName}
              />
            </View>

            {/* Node Image Picker */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Node Image
              </Text>
              {nodeImage ? (
                <View className="relative">
                  <Image
                    source={{ uri: nodeImage }}
                    className="w-full h-40 rounded-lg"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={pickImage}
                    className="absolute bottom-2 right-2 bg-accent px-3 py-1.5 rounded-md"
                  >
                    <Text className="text-white text-xs font-semibold">
                      Change Image
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickImage}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
                >
                  <Text className="text-main font-medium">📷 Select Image</Text>
                  <Text className="text-xs text-main mt-1">
                    Upload an image of the installed node
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sensor Thresholds Section */}
          <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <Text className="text-lg font-semibold text-main mb-1">
              Sensor Thresholds
            </Text>
            <Text className="text-xs text-muted mb-4">
              Set min/max bounds for alerts
            </Text>

            {INITIAL_SENSORS.map((sensor) => (
              <View
                key={sensor.id}
                className="mb-4 border-b border-gray-100 pb-3 last:border-b-0"
              >
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  {sensor.label}
                </Text>
                <View className="flex-row space-x-3 gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">
                      Min Threshold
                    </Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-emerald-600"
                      placeholder="Min"
                      keyboardType="numeric"
                      value={thresholds[sensor.minKey]}
                      onChangeText={(val) =>
                        handleThresholdChange(sensor.minKey, val)
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">
                      Max Threshold
                    </Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-emerald-600"
                      placeholder="Max"
                      keyboardType="numeric"
                      value={thresholds[sensor.maxKey]}
                      onChangeText={(val) =>
                        handleThresholdChange(sensor.maxKey, val)
                      }
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-accent py-3.5 rounded-xl items-center mb-16 shadow-md active:bg-emerald-700"
          >
            <Text className="text-main font-bold text-lg">Save Farm Node</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
