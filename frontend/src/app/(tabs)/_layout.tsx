import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

export default function TabLayout() {
  const LineTabBarIcon = ({ 
    focused, 
    iconName, 
    label 
  }: { 
    focused: boolean; 
    iconName: string; 
    label: string;
  }) => {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 60,
      }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons 
            name={iconName as any} 
            size={25} 
            color={focused ? '#667EEA' : '#64748B'} 
          />
        </View>
        <Text style={{
          fontSize: 12,
          color: focused ? '#667EEA' : '#64748B',
          marginTop: -5
        }}>
          {label}
        </Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 72,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 4,
        },
      }}  
    >
      {/* <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons size={25} name="home-outline" color='black' />,
        }}
      /> */}

      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <LineTabBarIcon 
              focused={focused}
              iconName="home-outline"
              label="Home"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <LineTabBarIcon 
              focused={focused}
              iconName="settings-outline"
              label="Setting"
            />
          ),
        }}
      />
    </Tabs>
  );
}