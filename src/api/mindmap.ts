import httpClient from './httpClient';

export type MindmapAsyncResponse = {
  processId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
};

export const createMindmapAsync = async (repoUrl: string, title?: string): Promise<MindmapAsyncResponse> => {
  const payload: { repoUrl: string; title?: string } = { repoUrl };
  if (title && title.trim()) payload.title = title.trim();
  const res = await httpClient.post('/mindmaps/async', payload);
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

// ================= Invitations =================
export type MindmapInvitationRole = 'EDITOR' | 'VIEWER';
export async function inviteMindmap(mapId: number, body: { email: string; role: MindmapInvitationRole }) {
  const res = await httpClient.post(`/invitations/mindmaps/${mapId}`, body);
  return res.data;
}

export type MindmapInvitationItem = {
  invitationId: number;
  mindmapTitle: string;
  inviteeName: string;
  inviteeEmail: string;
  role: MindmapInvitationRole;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string;
  createdAt: string;
};

export type PageResponse<T> = {
  content: T[];
  pageable: any;
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  empty: boolean;
};

export async function getMindmapInvitations(mapId: number, params: { page?: number; size?: number } = {}) {
  const { page = 0, size = 10 } = params;
  const res = await httpClient.get<PageResponse<MindmapInvitationItem>>(`/invitations/mindmaps/${mapId}`, { params: { page, size } });
  return res.data;
}

export async function createMindmapInvitationLink(mapId: number): Promise<{ invitationLink: string }> {
  const res = await httpClient.post(`/invitations/mindmaps/${mapId}/link`);
  return res.data as { invitationLink: string };
}

export async function acceptInvitationByToken(token: string) {
  const res = await httpClient.post(`/invitations/link/${token}/accept`);
  return res.data;
}

export async function approveInvitation(invitationId: number) {
  const res = await httpClient.post(`/invitations/${invitationId}/approve`);
  return res.data;
}

export async function rejectInvitation(invitationId: number) {
  const res = await httpClient.post(`/invitations/${invitationId}/reject`);
  return res.data;
}

export async function acceptInvitation(invitationId: number) {
  const res = await httpClient.post(`/invitations/${invitationId}/accept`);
  return res.data;
}

export async function deleteInvitation(invitationId: number) {
  const res = await httpClient.delete(`/invitations/${invitationId}`);
  return res.data;
}

// Realtime connected users
export type ConnectedUser = {
  userId: number;
  nickname: string;
  profileImage?: string;
};

export async function getConnectedUsers(mapId: number): Promise<ConnectedUser[]> {
  const res = await httpClient.get(`/mindmaps/${mapId}/connections/users`);
  return res.data as ConnectedUser[];
}

// Mindmap presence SSE
export type MindmapSSEMessage = {
  type: string;
  payload?: any;
};

export function connectMindmapSSE({
  baseUrl,
  mapId,
  onMessage,
  onError,
  withCredentials = true,
}: {
  baseUrl: string;
  mapId: number;
  onMessage: (msg: MindmapSSEMessage) => void;
  onError?: (ev: Event) => void;
  withCredentials?: boolean;
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/mindmaps/${mapId}/sse`;
  const es = new EventSource(url, { withCredentials });
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data as MindmapSSEMessage);
    } catch {
      // ignore
    }
  };
  es.onerror = (ev) => { if (onError) onError(ev); };
  return es;
}

// ================= Prompts =================
export async function sendMindmapPrompt(mapId: number, prompt: string) {
  const res = await httpClient.post(`/mindmaps/${mapId}/prompts`, { prompt });
  return res.data;
}

export type PromptHistoryItem = {
  historyId: number;
  prompt: string;
  summary: string;
  applied: boolean;
  createdAt: string;
};

export async function getMindmapPromptHistories(
  mapId: number,
  params: { page?: number; size?: number } = {}
) {
  const { page = 0, size = 10 } = params;
  const res = await httpClient.get(`/mindmaps/${mapId}/prompts/histories`, { params: { page, size } });
  return res.data as PageResponse<PromptHistoryItem>;
}
