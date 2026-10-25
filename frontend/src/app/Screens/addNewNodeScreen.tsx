import { View, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function AddNewNode() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View>
        <Text>Start adding new nodes</Text>
      </View>
    </>
  )
}