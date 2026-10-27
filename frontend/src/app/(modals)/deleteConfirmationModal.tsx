import React from "react";
import { View, Text, Modal, TouchableOpacity, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

interface DeleteConfirmationModalProps {
  visible: boolean;
  nodeName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  visible,
  nodeName,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        {/* Click outside to close */}
        <Pressable className="absolute inset-0" onPress={onClose} />

        {/* Modal Content Card */}
        <View className="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-xl border border-gray-100 relative z-10">
          {/* Warning Icon Header */}
          <View className="w-12 h-12 rounded-full bg-red-50 items-center justify-center mb-4 self-center">
            <Feather name="alert-triangle" size={24} color="#EF4444" />
          </View>

          {/* Title & Description */}
          <Text className="text-xl font-bold text-main text-center mb-2">
            Delete Node?
          </Text>
          <Text className="text-sm text-muted text-center mb-6">
            Are you sure you want to delete <Text className="font-semibold text-main">"{nodeName}"</Text>? This action is permanent and cannot be undone.
          </Text>

          {/* Action Buttons */}
          <View className="flex-row space-x-3 gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={isDeleting}
              className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center justify-center active:bg-gray-200"
            >
              <Text className="text-main font-semibold text-base">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-500 py-3.5 rounded-xl items-center justify-center shadow-sm active:bg-red-600"
            >
              <Text className="text-white font-semibold text-base">
                {isDeleting ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}