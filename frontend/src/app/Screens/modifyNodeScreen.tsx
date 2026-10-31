import { useState } from "react";
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
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useFarmNodeStore } from "@/store/farmNodeStore";
import { addNewNode, updateNode } from "@/services/farmNodeServices";
import ConfirmationModal from "../(modals)/showMessageModal";
import { FarmNodeTypes, NumericSensorKey , FarmNodeUploadTypes} from "../(types)/NodeDataType";

const INITIAL_SENSORS = [
  {
    id: "temp",
    label: "Temperature (°C)",
    minKey: "min_temperature",
    maxKey: "max_temperature",
    minDefault: "25",
    maxDefault: "30"
  },
  {
    id: "humidity",
    label: "Humidity (%)",
    minKey: "min_humidity",
    maxKey: "max_humidity",
    minDefault: "55",
    maxDefault: "75"
  },
  { 
    id: "ph", 
    label: "pH (%)", 
    minKey: "min_pH", 
    maxKey: "max_pH" ,
    minDefault: "5.5",
    maxDefault: "6.5"
  },
  { 
    id: "tds", 
    label: "TDS",
    minKey: "min_tds", 
    maxKey: "max_tds",
    minDefault: "600",
    maxDefault: "800"
  },
] as const;

const requiredKeys: NumericSensorKey[] = [
  "min_temperature", "max_temperature",
  "min_humidity", "max_humidity",
  "min_pH", "max_pH",
  "min_tds", "max_tds"
];

const defaultValues = ["25", "30", "55", "75", "5.5", "6.5", "500", "750"];

export default function FarmNodeForm() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const addNodeToStore = useFarmNodeStore((state) => state.addNode);
  const updateNodeToStore = useFarmNodeStore((state) => state.updateNode);
  const currentNode = useFarmNodeStore(
    (state) => state.nodes.filter((node) => node.node_id == params.node_id)[0],
  );

  const [nodeImage, setNodeImage] = useState(null); // we don't need this one too
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [nodeData, setNodeData] = useState<FarmNodeTypes>(
    currentNode || {
      node_id: "",
      node_name: "",
      min_temperature: "",
      min_humidity: "",
      min_pH: "",
      min_tds: "",
      max_temperature: "",
      max_humidity: "",
      max_pH: "",
      max_tds: "",
    },
  );

  const handleThresholdChange = (key: keyof FarmNodeTypes, value: string) => {
    setNodeData((prev) => (prev ? { ...prev, [key]: value } : prev));
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
    setIsSaving(true);
    if (typeof nodeData.node_name !== "string" || !nodeData.node_name.trim()) {
      setIsMessageModalVisible(true);
      setMessage("Node name is required");
      setIsSaving(false);
      return;
    }
    
    const parsedData: Record<string, any> = { ...nodeData };

    requiredKeys.map((key, idx) => {
      let val = nodeData[key];

      if (val === "" || val === null || val === undefined) {
        val = defaultValues[idx];
      }

      const numericVal = Number(val);

      if (isNaN(numericVal)) {
        setIsMessageModalVisible(true);
        setMessage("Put nemeric values for sensor threshold please!");
        setIsSaving(false);
        return;
      }

      parsedData[key] = numericVal;
    });

    // 4. Check if data values are physically reasonable/realistic
    const isReasonable =
      parsedData.min_temperature >= -50 &&
      parsedData.max_temperature <= 100 && // Temperature: -50°C to 100°C
      parsedData.min_humidity >= 0 &&
      parsedData.max_humidity <= 100 && // Humidity: 0% to 100%
      parsedData.min_pH >= 0 &&
      parsedData.max_pH <= 14 && // pH scale: 0 to 14
      parsedData.min_tds >= 0 &&
      parsedData.max_tds >= 0; // TDS: Cannot be negative

    if (!isReasonable) {
      setIsMessageModalVisible(true);
      setMessage("Put reasonable values for sensor thresholds please!");
      setIsSaving(false);
      return;
    }

    // 5. Check logical bounds (min must not exceed max)
    if (
      parsedData["min_temperature"] > parsedData["max_temperature"] ||
      parsedData["min_humidity"] > parsedData["max_humidity"] ||
      parsedData["min_pH"] > parsedData["max_pH"] ||
      parsedData["min_tds"] > parsedData["max_tds"]
    ) {
      setIsMessageModalVisible(true);
      setMessage("Minimum threshold should't exceed maximum threshold!");
      setIsSaving(false);
      return;
    }

    if (params.node_id) {
      const status = await updateNode(nodeData);
      setIsSaving(false);

      if (status == 200) {
        updateNodeToStore(nodeData);
        router.back();
      }
    } else {
      const { node_id, ...rest } = nodeData;
      const res = await addNewNode(rest);
      setIsSaving(false);

      if (res?.status == 200) {
        addNodeToStore({ ...nodeData, node_id: res.node_id });
        router.back();
      }
    }
  };

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
            <Text className="text-2xl font-bold text-main">Add New Node</Text>

            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 bg-surface rounded-full items-center justify-center shadow-sm"
            >
              <Feather name="arrow-left" size={20} color="#111827" />
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
                placeholder="e.g., Greenhouse 1"
                value={nodeData.node_name ? String(nodeData.node_name) : ""}
                onChangeText={(name) =>
                  setNodeData({ ...nodeData, node_name: name })
                }
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

          {/* Sensor nodeData Section */}
          <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <Text className="text-lg font-semibold text-main mb-1">
              Sensor nodeData
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
                      placeholder={sensor.minDefault}
                      keyboardType="numeric"
                      value={
                        nodeData?.[sensor.minKey]
                          ? String(nodeData?.[sensor.minKey])
                          : ""
                      }
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
                      placeholder={sensor.maxDefault}
                      keyboardType="numeric"
                      value={
                        nodeData?.[sensor.maxKey]
                          ? String(nodeData?.[sensor.maxKey])
                          : ""
                      }
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
            <Text className="text-main font-bold text-lg">{isSaving ? "Saving..." : "Save Farm Node"}</Text>
          </TouchableOpacity>

          <ConfirmationModal
            visible={isMessageModalVisible}
            onConfirm={() => setIsMessageModalVisible(false)}
            message={message}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
