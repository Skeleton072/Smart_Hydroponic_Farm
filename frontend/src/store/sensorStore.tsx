import { create } from "zustand";
import { SensorReadingsType } from "@/app/(types)/SensorDataType";

interface SensorStore {
  sensorReadings: Record<string, SensorReadingsType>;

  setSensorReadings: (sensorReadings: Record<string, SensorReadingsType>) => void

  // we don't even need to update actually
  updateSensorReadings: (
    nodeId: string,
    data: SensorReadingsType
  ) => void;

}

export const useSensorStore = create<SensorStore>((set) => ({
  sensorReadings: {},

  setSensorReadings: (sensorReadings) => set({ sensorReadings }),

  updateSensorReadings: (nodeId, data) =>
    set((state) => ({
      sensorReadings: {
        ...state.sensorReadings,
        [nodeId]: data,
      },
    })),
}));