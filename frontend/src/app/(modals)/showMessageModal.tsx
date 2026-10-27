import React from "react";
import { View, Text, Modal, TouchableOpacity, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ShowMessageModalProps {
  visible: boolean;
  onConfirm: () => void;
  message: string;
}

export default function ShowMessageModal({
  visible,
  onConfirm,
  message,
}: ShowMessageModalProps) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onConfirm}
    >
      {/* Backdrop */}
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        {/* Click outside to close */}
        <Pressable className="absolute inset-0" onPress={onConfirm} />

        {/* Modal Content Card */}
        <View className="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-xl border border-gray-100 relative z-10">
          {/* Warning Icon Header */}
          <View className="w-12 h-12 rounded-full bg-red-50 items-center justify-center mb-4 self-center">
            <Feather name="alert-triangle" size={24} color="#EF4444" />
          </View>

          {/* Title & Description */}
          <Text className="text-xl font-bold text-main text-center mb-2">
            {message}
          </Text>
          {/* <Text className="text-sm text-muted text-center mb-6">
            Fill all the forms please.
          </Text> */}

          {/* Action Buttons */}
          <View className="flex-row space-x-3 gap-3">
            <TouchableOpacity
              onPress={onConfirm}
              className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center justify-center active:bg-gray-200"
            >
              <Text className="text-main font-semibold text-base">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}