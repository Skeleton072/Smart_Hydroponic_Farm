import { 
  ESPProvisionManager, 
  ESPDevice, 
  ESPTransport, 
  ESPSecurity 
} from '@orbital-systems/react-native-esp-idf-provisioning';

// 1. Search for ESP32 devices broadcasting via BLE
export async function discoverDevices() {
  try {
    const prefix = 'PROV_'; // Adjust to match your device name prefix (e.g., 'PROV_')
    const transport = ESPTransport.ble;
    const security = ESPSecurity.secure2; // Match security setup on your ESP32 firmware

    const devices: ESPDevice[] = await ESPProvisionManager.searchESPDevices(
      prefix, 
      transport, 
      security
    );

    console.log('Found devices:', devices);
    return devices;
  } catch (error) {
    console.error('Failed to scan for devices:', error);
  }
}

// 2. Connect and share Wi-Fi credentials
export async function provisionDevice(device: ESPDevice, ssid: string, passphrase: string, pop: string) {
  try {
    // Establish secure connection with the device using proof of possession (pop)
    await device.connect(pop);

    // Send the target router Wi-Fi credentials
    await device.provision(ssid, passphrase);
    
    console.log('Wi-Fi credentials successfully sent to ESP32!');
  } catch (error) {
    console.error('Provisioning failed:', error);
  } finally {
    // Always ensure you disconnect when done or on failure
    await device.disconnect();
  }
}