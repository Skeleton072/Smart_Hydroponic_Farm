import { useEffect, useRef } from "react";
import { useFarmNodeStore } from "@/store/farmNodeStore";
import { useSensorStore } from "@/store/sensorStore";

export function useWebSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const farmNodes = useFarmNodeStore((state) => state.nodes);
  const setSensorReadings = useSensorStore((state) => state.setSensorReadings);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { status, action } = data;

        if (status == 'success' && action == "sensor_readings") {
          const { sensorReadings } = data;

          setSensorReadings(sensorReadings);
        }

      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && farmNodes.length > 0) {
        socketRef.current.send(JSON.stringify({
          "action": "unsubscribe_node",
          "nodeId": farmNodes.map((node) => node.node_id),
        }));
      }
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = (data: object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  return { sendMessage };
}