import { create } from "zustand";
import { SensorReadingsType } from "@/app/(types)/SensorDataType";

interface SensorStore {
  loading: boolean;
  sensorReadings: Record<string, SensorReadingsType>;

  setLoading: (loading: boolean) => void;
  setSensorReadings: (sensorReadings: Record<string, SensorReadingsType>) => void

  // we don't even need to update actually
  updateSensorReadings: (
    nodeId: string,
    data: SensorReadingsType
  ) => void;

}

export const useSensorStore = create<SensorStore>((set) => ({
  loading: false,
  sensorReadings: {},

  setLoading: (loading) => set({ loading }),

  setSensorReadings: (sensorReadings) => set({ sensorReadings }),

  updateSensorReadings: (nodeId, data) =>
    set((state) => ({
      sensorReadings: {
        ...state.sensorReadings,
        [nodeId]: data,
      },
    })),
}));