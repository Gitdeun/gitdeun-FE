import httpClient from "./httpClient";
import { EventSourcePolyfill } from "event-source-polyfill";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

type Handlers = {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onError?: (e: any) => void;
};

export function openNotificationSSE(handlers: Handlers = {}) {
  const token = localStorage.getItem("accessToken")?.trim();
  if (!token) {
    console.warn("SSE: accessToken 없음");
    return { close: () => {} };
  }
  // Prefer axios baseURL to guarantee same origin/port
  const base = (httpClient.defaults.baseURL as string) || API_BASE;
  const url = `${base.replace(/\/$/, '')}/notifications/sse`;
  const es = new EventSourcePolyfill(url, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
    heartbeatTimeout: 60_000,
  });

  es.onopen = () => handlers.onOpen?.();
  const handle = (data: any) => {
    if (data === "connected") return;
    try { handlers.onMessage?.(JSON.parse(data)); }
    catch { handlers.onMessage?.(data); }
  };
  es.onmessage = (evt) => handle(evt.data);
  // Some servers send named events
  es.addEventListener?.('newNotification', (evt: MessageEvent) => handle((evt as any).data));
  es.onerror = (e) => handlers.onError?.(e);

  return { close: () => es.close() };
}

export type NotificationItem = {
  notificationId: number;
  message: string;
  read: boolean;
  notificationType: string;
  createdAt: string;     // ISO
  referenceId: number;
  expiresAt: string;
  actionAvailable: boolean;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

// 사용자의 모든 알림 조회
export async function fetchNotifications(params: { page?: number; size?: number } = {}) {
  const res = await httpClient.get<Page<NotificationItem>>("/notifications", { params });
  return res.data;
}

// 알림 삭제
export async function deleteNotification(id: number) {
  const res = await httpClient.delete(`/notifications/${id}`);
  return res.data;
}

// 알림 읽음 처리
export async function markAsRead(id: number) {
  const res = await httpClient.patch(`/notifications/${id}/read`);
  return res.data;
}

// 읽지 않은 알림 개수 조회
export async function getUnreadCount() {
  const res = await httpClient.get<{ unreadCount: number }>('/notifications/unread-count');
  return res.data;
}