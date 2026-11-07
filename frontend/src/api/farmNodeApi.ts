import { apiClient } from "./client";
import { FarmNodeUploadTypes, FarmNodeTypes } from "@/app/(types)/NodeDataType";

export const farmNodeApi = {
  getAllFarmNodes: async () => {
    const response = await apiClient.get("/api/node/getAllNodes");
    return response.data.data;
  },

  addNewNode: async (payload: FarmNodeUploadTypes) => {
    const response = await apiClient.post("/api/node/addNewNode", payload);
    return { status: response.status, node_id: String(response.data.node_id) };
  },

  updateNode: async (payload: FarmNodeTypes) => {
    const response = await apiClient.post("/api/node/updateNode", payload);
    return response.status;
  },

  deleteNode: async (node_id: string) => {
    const response = await apiClient.post("/api/node/deleteNode", node_id);
    return response.status;
  }
};