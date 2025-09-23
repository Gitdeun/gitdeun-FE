import httpClient from './httpClient';

export type VisitHistoryItem = {
  visitHistoryId: number;
  mindmapId: number;
  mindmapTitle: string;
  repoUrl: string;
  lastVisitedAt: string; 
};

export type PageMeta = {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
};

export type VisitHistoryResponse = {
  content: VisitHistoryItem[];
  pageable: unknown;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: unknown;
  numberOfElements: number;
  empty: boolean;
};

export async function getVisitHistory(params: { page?: number; size?: number } = {}) {
  const { page = 0, size = 10 } = params;
  const res = await httpClient.get<VisitHistoryResponse>('/history/visits', { params: { page, size } });
  return res.data;
}

export async function getPinnedVisits() {
  const res = await httpClient.get<VisitHistoryItem[]>('/history/pins');
  return res.data;
}

export async function pinVisit(historyIdOrMindmapId: number) {
  return httpClient.post(`/history/${historyIdOrMindmapId}/pin`);
}

export async function unpinVisit(historyIdOrMindmapId: number) {
  return httpClient.delete(`/history/${historyIdOrMindmapId}/pin`);
}


export type HistorySSEMessage = {
  type: string; 
  payload?: any;
};

export function throttle<T extends (...args: any[]) => any>(fn: T, wait = 1000) {
  let last = 0;
  let timeout: number | null = null;
  let pendingArgs: any[] | null = null;
  const invoke = (args: any[]) => {
    last = Date.now();
    fn(...args);
  };
  return (...args: any[]) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timeout) { window.clearTimeout(timeout); timeout = null; }
      invoke(args);
    } else {
      pendingArgs = args;
      if (!timeout) {
        timeout = window.setTimeout(() => {
          timeout = null;
          if (pendingArgs) { invoke(pendingArgs); pendingArgs = null; }
        }, remaining);
      }
    }
  };
}

export function connectHistorySSE({
  baseUrl,
  onMessage,
  onError,
  withCredentials = true,
}: {
  baseUrl: string; 
  onMessage: (msg: HistorySSEMessage) => void;
  onError?: (ev: Event) => void;
  withCredentials?: boolean;
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/history/sse`;
  const es = new EventSource(url, { withCredentials });
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data as HistorySSEMessage);
    } catch (_) {
      // ignore parse errors
    }
  };
  es.onerror = (ev) => {
    if (onError) onError(ev);
  };
  return es;
}
