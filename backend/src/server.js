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
const WebSocket = require("ws");
// const { startMonitoringMany, stopMonitoringMany } = require("../services/monitoringService");
const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  console.log("Hello World");

  return res.status(200).json({ message: "Hello World" });
});
app.use("/api/node", nodeRouter);

// web socket
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (socket) => {
  console.log("WebSocket has started...");
  const subscribedNodes = new Set();

  socket.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.action === "subscribe_nodes") {
        const nodeIds = data.nodeIds;

        // Validate that the user owns these nodes first.

        const newNodes = nodeIds.filter(
          id => !subscribedNodes.has(id)
        );

        newNodes.forEach(id => subscribedNodes.add(id));

        // startMonitoringMany(newNodes, socket);

        socket.send(JSON.stringify({
          status: "success",
          action: "sensor_readings",
          message: `Successfully subscribed to nodes: ${newNodes.join(", ")}`,
          sensorReadings: {
            [nodeIds[0]]: {
              "water_temperature": "25",
              "humidity": "75",
              "pH": "6.5",
              "tds": "700",
              "timestamp": "10-31-2026"
            }
          }
        }));
      }

      if (data.action === "unsubscribe_nodes") {
        const nodeIds = data.nodeIds;

        const existingNodes = nodeIds.filter(
          id => subscribedNodes.has(id)
        );

        existingNodes.forEach(id => subscribedNodes.delete(id));

        // stopMonitoringMany(existingNodes, socket);
      }

    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  });

  socket.on("close", () => {
    // stopMonitoringMany([...subscribedNodes], socket);
    subscribedNodes.clear();
  });
});


// mqtt client
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker successfully!");

  mqttClient.subscribe("hydroponics/sensors", (err) => {
    if (!err) {
      console.log("Subscribed to topic: hydroponics/sensors");
    } else {
      console.error("Subscription error:", err);
    }
  });
});


mqttClient.on("message", (topic, payload) => {
  console.log(`\nReceived message on [${topic}]:`);

  try {
    const data = JSON.parse(payload.toString());

    console.log("Parsed Sensor Data:");
    console.log(`- Water Temperature : ${data.water_temperature}°C`);
    console.log(`- Humidity : ${data.humidity}%`);
    console.log(`- pH : ${data.pH}`);
    console.log(`- TDS : ${data.tds}ppm`);
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