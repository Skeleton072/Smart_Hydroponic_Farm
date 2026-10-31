import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFarmNodeStore } from "@/store/farmNodeStore";
import { FarmNodeTypes } from '../(types)/NodeDataType'
import { useSensorStore } from "@/store/sensorStore";
import { SensorReadingsType } from "../(types)/SensorDataType";

const imageMap: Record<string, any> = {
  "salad.jpg": require("@/assets/images/salad.jpg"),
};

export default function FarmDashboard() {
  const router = useRouter();

  const farmNodes = useFarmNodeStore((state) => state.nodes);
  const isLoading = useFarmNodeStore((state) => state.loading);
  const sensorReadings = useSensorStore((state) => state.sensorReadings);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="w-full h-full flex items-center justify-center">
          <Text>Fetching farm nodes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="flex-row items-center justify-between px-6 pt-4 mb-6">
          <View className="w-12 h-12 rounded-full overflow-hidden bg-muted/20" />

          <View className="flex-row items-center space-x-3 gap-2">
            <TouchableOpacity className="w-11 h-11 bg-surface rounded-full items-center justify-center shadow-sm">
              <Feather name="search" size={20} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity className="w-11 h-11 bg-surface rounded-full items-center justify-center shadow-sm">
              <Feather name="bell" size={20} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title & Action Bar */}
        <View className="px-6 mb-6 flex flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold tracking-tight text-main">
              Your Farm Nodes
            </Text>
            <Text className="text-xs text-muted mt-0.5">
              Manage and monitor active units
            </Text>
          </View>

          <Pressable
            className="flex flex-row items-center space-x-2 px-4 py-2.5 rounded-pill bg-primary active:opacity-90 shadow-sm"
            onPress={() => router.push("/Screens/modifyNodeScreen")}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text className="text-sm font-semibold tracking-tight text-white">
              Add node
            </Text>
          </Pressable>
        </View>

        {/* Farm Nodes List */}
        {/* <View>
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#0000ff" />
              <Text className="mt-10 text-sm">Loading assets...</Text>
            </View>
          ) : (
            farmNodes.map((node, idx) => (
              <View key={idx}>
                <FarmNode name={node.node_name} imageUrl="salad.jpg" />
              </View>
            ))
          )}
        </View> */}

        <View>
          {farmNodes.map((node, idx) => (
            <View key={idx}>
              <FarmNode node={node} name={node.node_name} imageUrl="salad.jpg" sensorReadings={sensorReadings[node.node_id]}/>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FarmNode({ node, name, imageUrl, sensorReadings }: { node: FarmNodeTypes, name: string; imageUrl: string, sensorReadings: SensorReadingsType }) {
  const router = useRouter();
  const icons: any = [
    <MaterialCommunityIcons name="thermometer" size={20} color="#111827" />,
    <Ionicons name="water" size={20} color="#111827" />,
    <MaterialCommunityIcons name="sprout" size={20} color="#111827" />,
    <FontAwesome5 name="water" size={20} color="#111827" />,
  ];
  const units = ["°C", "%", "pH", " ppm"];

  const { timestamp, ...sensorReading } = sensorReadings;

  console.log(sensorReading);

  return (
    <View className="px-6 mb-5">
      <View className="rounded-3xl overflow-hidden h-64 shadow-lg relative flex justify-between bg-cardBg">
        <Image
          className="absolute w-full h-full rounded-3xl opacity-75"
          source={imageMap[imageUrl] || imageMap["salad.jpg"]}
        />

        <View className="flex-row items-center justify-between w-full px-4 pt-4">
          <Text className="text-white text-2xl font-bold tracking-wide">
            {name}
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/Screens/nodeDetailScreen",
                params: { node_id: node.node_id },
              })
            }
            className="w-10 h-10 bg-surface/90 rounded-full items-center justify-center"
          >
            <Feather name="arrow-up-right" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <View className="w-full flex-row justify-between space-x-3 bg-black/40 backdrop-blur-md px-4 py-3">
          {
            Object.entries(sensorReading).map(([sensor, value], idx) => (
                <View key={`${sensor}-${idx}`} className="flex-1 items-center">
                <View className="w-10 h-10 rounded-full bg-accent items-center justify-center mb-1">
                  {icons[idx]}
                </View>
                <Text className="text-white font-bold text-base">
                  {String(value)} {units[idx]}
                </Text>
                <Text className="text-gray-300 text-xs">{sensor}</Text>
              </View>
              )
            )
          }
        </View>
      </View>
    </View>
  );
}
