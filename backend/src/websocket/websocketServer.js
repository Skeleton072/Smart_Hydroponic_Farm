const WebSocket = require("ws");
// const { startMonitoringMany, stopMonitoringMany } = require("../services/monitoringService");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (socket) => {
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