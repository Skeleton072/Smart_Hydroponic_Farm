import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
} from "react-native";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useFarmNodeStore } from "@/store/farmNodeStore";
import DeleteConfirmationModal from "../(modals)/deleteConfirmationModal";
import { useState } from "react";
import { deleteNode } from "@/services/farmNodeServices";
import { FarmNodeTypes } from "../(types)/NodeDataType";

const imageMap: Record<string, any> = {
  "salad.jpg": require("@/assets/images/salad.jpg"),
};

const SENSOR_ICONS = [
  { lib: MaterialCommunityIcons, name: "thermometer" },
  { lib: Ionicons, name: "water" },
  { lib: MaterialCommunityIcons, name: "sprout" },
  { lib: FontAwesome5, name: "water" },
];

export default function NodeDetailScreen() {
  const router = useRouter();
  const { node_id } = useLocalSearchParams();
  const removeNode = useFarmNodeStore((state) => state.removeNode);
  const node: FarmNodeTypes = useFarmNodeStore(
    (state) => state.nodes.filter((node) => node.node_id == node_id)[0],
  );

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteNode() {
    try {
      setIsDeleting(true);
      const status = await deleteNode(node!.node_id);

      if (status != 200) {
        console.log("Some error happened.");
        return;
      }

      removeNode(node!.node_id);
      setIsDeleteModalVisible(false);
      router.back();
    } catch (error) {
      console.error("Failed to delete node:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  const currentSensors = [
    { label: "Temperature", value: "67", unit: "°F", status: "Optimal" },
    { label: "Humidity", value: "85", unit: "%", status: "Normal" },
    { label: "pH Level", value: "5.5", unit: "pH", status: "Optimal" },
    { label: "TDS", value: "660", unit: "ppm", status: "Normal" },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View className="flex-row items-center justify-between px-6 pt-4 mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 bg-surface rounded-full items-center justify-center shadow-sm"
            >
              <Feather name="arrow-left" size={20} color="#111827" />
            </TouchableOpacity>

            <Text className="text-xl font-bold text-main">
              {node?.node_name}
            </Text>

            <TouchableOpacity className="w-11 h-11 bg-surface rounded-full items-center justify-center shadow-sm">
              <Feather name="settings" size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Hero Banner */}
          <View className="px-6 mb-6">
            <View className="rounded-3xl overflow-hidden h-52 shadow-lg relative justify-end bg-cardBg">
              <Image
                className="absolute w-full h-full opacity-75"
                source={imageMap["salad.jpg"]}
              />
              <View className="bg-black/40 backdrop-blur-md px-5 py-4 flex-row justify-between items-center">
                <View>
                  <Text className="text-white text-xl font-bold">
                    {node?.node_name}
                  </Text>
                  {/* <Text className="text-gray-300 text-xs">ID: {nodeId}</Text> */}
                </View>
                <View className="bg-emerald-500/90 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    Active
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Current Sensor Values Grid */}
          <View className="px-6 mb-6">
            <Text className="text-base font-bold text-main mb-3">
              Current Sensor Readings
            </Text>
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {currentSensors.map((sensor, idx) => {
                const IconComponent = SENSOR_ICONS[idx].lib;
                const iconName = SENSOR_ICONS[idx].name;

                return (
                  <View
                    key={idx}
                    className="bg-surface rounded-2xl p-4 w-[48%] shadow-sm border border-gray-100"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
                        <IconComponent
                          name={iconName}
                          size={24}
                          color="#111827"
                        />
                      </View>
                      <Text className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {sensor.status}
                      </Text>
                    </View>
                    <Text className="text-2xl font-bold text-main mt-1">
                      {sensor.value}
                      <Text className="text-xs font-normal text-muted">
                        {" "}
                        {sensor.unit}
                      </Text>
                    </Text>
                    <Text className="text-xs text-muted mt-0.5">
                      {sensor.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Threshold Configuration Details */}
          <View className="px-6 mb-8">
            <View className="flex-1 flex-row items-center justify-between mb-2">
              <Text className="text-base font-bold text-main mb-3">
                Threshold Limits
              </Text>

              <Pressable
                className="flex flex-row items-center space-x-2 px-4 py-1 rounded-pill bg-primary active:opacity-90 shadow-sm"
                onPress={() => {
                  router.push({
                    pathname: "/Screens/modifyNodeScreen",
                    params: { node_id: node?.node_id },
                  });
                }}
              >
                <Text className="text-base font-semibold tracking-tight text-white">
                  Modify Thresholds
                </Text>
              </Pressable>
            </View>
            <View className="bg-surface rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-sm text-muted">Temperature Range</Text>
                <Text className="text-sm font-semibold text-main">
                  {node?.min_temperature}°C – {node?.max_temperature}°C
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-sm text-muted">Humidity Range</Text>
                <Text className="text-sm font-semibold text-main">
                  {node?.min_humidity}% – {node?.max_humidity}%
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <Text className="text-sm text-muted">pH Range</Text>
                <Text className="text-sm font-semibold text-main">
                  {node?.min_pH} – {node?.max_pH}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-sm text-muted">TDS Range</Text>
                <Text className="text-sm font-semibold text-main">
                  {node?.min_tds} ppm – {node?.max_tds} ppm
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setIsDeleteModalVisible(true)}
            className="w-[80%] mx-auto flex-row items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-8"
          >
            {/* Optional: Add a subtle trash/warning icon if you use a library like @expo/vector-icons */}
            <Ionicons name="trash-outline" size={18} color="#ef4444" />

            <Text className="text-xl font-semibold tracking-wide text-red-500">
              Delete Node
            </Text>
          </TouchableOpacity>

          <DeleteConfirmationModal
            visible={isDeleteModalVisible}
            nodeName={node?.node_name || "this node"}
            onClose={() => setIsDeleteModalVisible(false)}
            onConfirm={handleDeleteNode}
            isDeleting={isDeleting}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}