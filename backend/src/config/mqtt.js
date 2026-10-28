const mqtt = require("mqtt");
const config = require("./config")

const MQTT_URL = config.mqtt.mqttUrl;
const options = {
  username: config.mqtt.mqttUsername,
  password: config.mqtt.mqttPassword
};

// console.log("Connecting to HiveMQ Cloud...");
const mqttClient = mqtt.connect(MQTT_URL, options);

module.exports = mqttClient;
