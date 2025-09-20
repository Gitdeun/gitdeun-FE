import httpClient from './httpClient';

export type MindmapAsyncResponse = {
  processId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
};

export const createMindmapAsync = async (repoUrl: string): Promise<MindmapAsyncResponse> => {
  const res = await httpClient.post('/mindmaps/async', { repoUrl });
  return res.data as MindmapAsyncResponse;
};

export type MindmapGraphNode = {
  key: string;
  label: string;
  mode: string | null;
  fileNode: boolean;
  fileCount: number;
  suggestionNode: boolean;
  related_files: string[];
  node_type: string | null;
};

export type MindmapGraphEdge = {
  containmentEdge: boolean;
  suggestionEdge: boolean;
  from: string;
  to: string;
  edge_type: string | null;
};

export type MindmapDetailResponse = {
  mindmapId: number;
  title: string;
  branch: string;
  mindmapGraph: {
    success: boolean;
    error: string | null;
    graphMapId: string;
    nodeCount: number;
    nodes: MindmapGraphNode[];
    edges: MindmapGraphEdge[];
  };
  createdAt: string;
  updatedAt: string;
  promptHistories: unknown[];
  appliedPromptHistory: unknown | null;
};

export async function getMindmapDetail(mapId: number): Promise<MindmapDetailResponse> {
  const res = await httpClient.get(`/mindmaps/${mapId}`);
  return res.data as MindmapDetailResponse;
}

// ================= SSE for Mindmap Creation =================
export type MindmapSSEMessage = {
  type: string; // e.g., 'MINDMAP_COMPLETED' | 'MINDMAP_FAILED' | 'PROGRESS'
  processId?: string;
  mindmapId?: number;
  status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message?: string;
};

export function connectMindmapSSE({
  baseUrl,
  onMessage,
  onError,
  withCredentials = true,
}: {
  baseUrl: string;
  onMessage: (msg: MindmapSSEMessage) => void;
  onError?: (ev: Event) => void;
  withCredentials?: boolean;
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/mindmaps/sse`;
  const es = new EventSource(url, { withCredentials });
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data as MindmapSSEMessage);
    } catch (_) {
      // ignore parse errors
    }
  };
  es.onerror = (ev) => {
    if (onError) onError(ev);
  };
  return es;
}

// ================= Update (PATCH) =================
export async function updateMindmapTitle(mapId: number, title: string) {
  const res = await httpClient.patch(`/mindmaps/${mapId}/title`, { title });
  return res.data;
}

// ================= Delete =================
export async function deleteMindmap(mapId: number) {
  const res = await httpClient.delete(`/mindmaps/${mapId}`);
  return res.data;
}
