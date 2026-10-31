import { create } from "zustand";
import { FarmNodeTypes } from "@/app/(types)/NodeDataType";

type FarmNodeStore = {
  nodes: FarmNodeTypes[];
  initialized: boolean;
  loading: boolean;

  setNodes: (nodes: FarmNodeTypes[]) => void;
  addNode: (node: FarmNodeTypes) => void;
  updateNode: (node: FarmNodeTypes) => void;
  removeNode: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
};

export const useFarmNodeStore = create<FarmNodeStore>((set) => ({
  nodes: [],
  initialized: false,
  loading: false,

  setNodes: (nodes) => set({ nodes }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (updatedNode) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.node_id === updatedNode.node_id ? updatedNode : node
      ),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.node_id !== id),
    })),

  setLoading: (loading) => set({ loading }),

  setInitialized: (initialized) => set({ initialized }),
}));