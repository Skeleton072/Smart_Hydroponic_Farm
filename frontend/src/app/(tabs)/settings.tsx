import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ShowMessageModal from '../(modals)/showMessageModal';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

// --- Type Definitions ---
interface SettingToggleProps {
  iconGroup: 'ionicons' | 'material';
  iconName: any;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}

interface SettingItemProps {
  iconGroup: 'ionicons' | 'material';
  iconName: any;
  label: string;
  value?: string;
  border?: boolean;
  onPress: () => void;
}

// --- Helper Icon Component ---
const SettingIcon: React.FC<{ group: 'ionicons' | 'material'; name: any }> = ({ group, name }) => {
  if (group === 'ionicons') {
    return <Ionicons name={name} size={20} color="#2563eb" />;
  }
  return <MaterialCommunityIcons name={name} size={20} color="#2563eb" />;
};

// --- Reusable Components ---
const SettingToggle: React.FC<SettingToggleProps> = ({ iconGroup, iconName, label, description, value, onValueChange }) => (
  <View className="flex-row items-center justify-between py-3 px-4 border-b border-muted">
    <View className="flex-row items-center flex-1 mr-3">
      <View className="w-9 h-9 rounded-full bg-[#2563eb]/10 items-center justify-center mr-3">
        <SettingIcon group={iconGroup} name={iconName} />
      </View>
      <View className="flex-1">
        <Text className="text-main text-base font-medium">{label}</Text>
        {description && (
          <Text className="text-muted text-xs mt-0.5">{description}</Text>
        )}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#4b5563', true: '#2563eb' }}
      thumbColor={value ? '#A3E635' : '#F3F4F6'}
    />
  </View>
);

const SettingItem: React.FC<SettingItemProps> = ({ iconGroup, iconName, label, value, border = true, onPress}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className={`flex-row items-center justify-between py-3 px-4 ${border ? "border-b border-muted" : ""}`}
  >
    <View className="flex-row items-center">
      <View className="w-9 h-9 rounded-full bg-[#2563eb]/10 items-center justify-center mr-3">
        <SettingIcon group={iconGroup} name={iconName} />
      </View>
      <Text className="text-main text-base font-medium">{label}</Text>
    </View>
    <View className="flex-row items-center">
      {value && <Text className="text-muted text-sm mr-2">{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color="#4b5563" />
    </View>
  </TouchableOpacity>
);

// --- Main Settings Component ---
export default function SettingsScreen() {
  const router = useRouter();
  // State for toggles
  const [autoDosing, setAutoDosing] = useState(true);
  const [lightSchedule, setLightSchedule] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const signout = useAuthStore((state) => state.signOut);

  const handleLogout = () => {
    setIsModalVisible(false);
    signout();

    router.replace("/(auth)/authScreen");
    console.log("Successfully logged out of the system.");
    return;
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 py-6">
      <Text className="mt-6 text-2xl font-bold text-[#111827] mb-4">Settings</Text>

      {/* --- Section 1: Automation & Thresholds --- */}
      <Text className="text-xs font-semibold text-[#4b5563] uppercase tracking-wider mb-2 ml-1">
        Hydroponic Controls
      </Text>
      <View className="bg-surface rounded-2xl overflow-hidden mb-6 shadow-sm border-cardBg border">
        <SettingToggle
          iconGroup="ionicons"
          iconName="water-outline"
          label="Auto Nutrient Dosing"
          description="Maintain target pH and EC levels automatically"
          value={autoDosing}
          onValueChange={setAutoDosing}
        />
        <SettingToggle
          iconGroup="ionicons"
          iconName="sunny-outline"
          label="Grow Light Automation"
          description="Follow 16h light / 8h dark schedule"
          value={lightSchedule}
          onValueChange={setLightSchedule}
        />
        <SettingItem
          iconGroup="ionicons"
          iconName="options-outline"
          label="Target Calibration"
          value="EC: 1.8 / pH: 6.0"
          border={false}
          onPress={() => {}}
        />
      </View>

      {/* --- Section 2: Notifications & System --- */}
      <Text className="text-xs font-semibold text-[#4b5563] uppercase tracking-wider mb-2 ml-1">
        System & Alerts
      </Text>
      <View className="bg-surface rounded-2xl overflow-hidden mb-6 shadow-sm border border-cardBg">
        <SettingToggle
          iconGroup="ionicons"
          iconName="notifications-outline"
          label="Push Notifications"
          description="Receive alerts for water levels and abnormalities"
          value={pushAlerts}
          onValueChange={setPushAlerts}
        />
        <SettingItem
          iconGroup="material"
          iconName="cpu-64-bit"
          label="Controller Hardware"
          value="ESP32 (v2.1)"
          onPress={() => {}}
        />
        <SettingItem
          iconGroup="ionicons"
          iconName="shield-checkmark-outline"
          label="Security & Access"
          onPress={() => {}}
        />
        <SettingItem
          iconGroup="ionicons"
          iconName="help-circle-outline"
          label="Help & Diagnostics"
          border={false}
          onPress={() => {}}
        />
      </View>

      <Text className="text-xs font-semibold text-[#4b5563] uppercase tracking-wider mb-2 ml-1">
        Accounts
      </Text>
      <View className="bg-surface rounded-2xl overflow-hidden mb-6 shadow-sm border border-cardBg">
        <SettingItem
          iconGroup="ionicons"
          iconName="log-out-outline"
          label="Log Out"
          border={false}
          value=""
          onPress={() => setIsModalVisible(true)}
        />
      </View>

      <ShowMessageModal visible={isModalVisible} onConfirm={handleLogout} message='Are you sure that you want to log out?' />

      {/* --- Section 3: Logout Action --- */}
      {/* <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleLogout}
        className="bg-[#111827] flex-row items-center justify-center py-4 rounded-full border border-red-500/20 mb-8"
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
        <Text className="text-red-500 font-semibold text-base">Log Out</Text>
      </TouchableOpacity>

      <Text className="text-center text-[#4b5563] text-xs mb-6">
        Smart Hydroponics v1.0.0
      </Text> */}
    </ScrollView>
  );
};

// export default SettingsScreen;