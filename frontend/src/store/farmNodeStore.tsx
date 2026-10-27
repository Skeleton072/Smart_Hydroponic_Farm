import { create } from "zustand";

export type FarmNode = {
  node_id: string;
  node_name: string;
  min_temperature: string;
  min_humidity: string;
  min_pH: string;
  min_tds: string;
  max_temperature: string;
  max_humidity: string;
  max_pH: string;
  max_tds: string;
};

type FarmNodeStore = {
  nodes: FarmNode[];
  initialized: boolean;
  loading: boolean;

  setNodes: (nodes: FarmNode[]) => void;
  addNode: (node: FarmNode) => void;
  updateNode: (node: FarmNode) => void;
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