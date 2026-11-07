import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';

interface LoadingModalProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  visible,
  message = 'Loading...',
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      {/* Backdrop overlay with semi-transparent dark background */}
      <View className="flex-1 bg-black/50 items-center justify-center px-4">
        
        {/* Modal card container */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 items-center shadow-xl w-48 max-w-sm">
          
          {/* Spinner */}
          <ActivityIndicator size="large" className="text-indigo-600 dark:text-indigo-400 mb-3" />
          
          {/* Loading Text */}
          {message && (
            <Text className="text-slate-700 dark:text-slate-200 text-base font-medium text-center">
              {message}
            </Text>
          )}
          
        </View>
      </View>
    </Modal>
  );
};

export default LoadingModal;