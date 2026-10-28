const path = require("path");
const dotenv = require("dotenv");

const env = process.env.NODE_ENV || "development";
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${env}`),
});

const express = require("express");
const cors = require("cors");
const nodeRouter = require("./routes/nodeRoute");
const mqttClient = require("./config/mqtt");
const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  console.log("Hello World");

  return res.status(200).json({ message: "Hello World" });
});
app.use("/api/node", nodeRouter);


mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker successfully!");

  // 2. Subscribe to the exact topic your ESP32 is publishing to
  mqttClient.subscribe("hydroponics/sensors", (err) => {
    if (!err) {
      console.log("Subscribed to topic: hydroponics/sensors");
    } else {
      console.error("Subscription error:", err);
    }
  });
});

// 3. Listen for incoming messages from the ESP32
mqttClient.on("message", (topic, payload) => {
  // topic is string, payload is a Buffer
  console.log(`\nReceived message on [${topic}]:`);

  try {
    // Parse the JSON string sent by the ESP32
    const data = JSON.parse(payload.toString());

    console.log("Parsed Sensor Data:");
    console.log(`- pH: ${data.ph}`);
    console.log(`- EC: ${data.ec}`);
    console.log(`- Water Temp: ${data.water_temp}°C`);

    // TODO: Insert your logic here (e.g., save to Supabase, check thresholds, trigger alarms)
  } catch (error) {
    console.error(
      "Failed to parse incoming payload as JSON:",
      payload.toString(),
    );
  }
});

mqttClient.on("error", (err) => {
  console.error("Connection error:", err);
});


app.listen(3000, () => {
  console.log("Server is listening at port 3000");
});