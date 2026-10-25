import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="house" color='black' />,
        }}
      />
      <Tabs.Screen name="screen2" options={{ title: 'screen2', headerShown: false }} />
    </Tabs>
  );
}