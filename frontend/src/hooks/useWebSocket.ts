import { useEffect, useRef, useState, useCallback } from "react";
import { useSensorStore } from "@/store/sensorStore";

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldReconnect = useRef(true);

  const setSensorReadings = useSensorStore((state) => state.setSensorReadings);
  const setLoadingSensors = useSensorStore((state) => state.setLoading);

  const connect = useCallback(() => {
    if (!url) return;

    // Close any existing instances before creating a new one
    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Clear any pending reconnection timeouts upon successful connection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { status, action } = data;

        if (status == 'success' && action == "sensor_readings") {
          const { sensorReadings } = data;
          setSensorReadings(sensorReadings);
          setLoadingSensors(false);
        }
        
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason);
      setIsConnected(false);

      // Attempt to reconnect if it wasn't a intentional close
      if (shouldReconnect.current) {
        console.log('Reconnecting in 3 seconds...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000); // 3-second delay before retry
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close(); // Triggers onclose to handle reconnection
    };
  }, [url]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', data);
    }
  }, []);

  return { isConnected, sendMessage };
}