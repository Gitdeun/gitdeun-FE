import { useEffect, useState } from "react";
import { X, Trash2, Info, Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  fetchNotifications,
  deleteNotification,
  markAsRead,

  type NotificationItem,
  type Page,
} from "../../api/notification";
import { acceptInvitation, deleteInvitation } from "../../api/mindmap";
import { toast } from "sonner";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  const d = Math.floor(h / 24);
  return `${d} days ago`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onChange?: () => void;
};

export default function NotificationsDrawer({ open, onClose, onChange }: Props) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<NotificationItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const res = await fetchNotifications({ page: p, size: 10 });
      setData(res);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load(0);
  }, [open]);

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    setData((prev) =>
      prev
        ? {
            ...prev,
            content: prev.content.filter((n) => n.notificationId !== id),
            totalElements: Math.max(0, prev.totalElements - 1),
          }
        : prev
    );
    onChange?.();
  };

  const handleClickItem = async (n: NotificationItem) => {
    if (!n.read) {
      try {
        await markAsRead(n.notificationId);
      } catch {}
      setData((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((x) =>
                x.notificationId === n.notificationId ? { ...x, read: true } : x
              ),
            }
          : prev
      );
      onChange?.();
    }
  };

  const handleMarkAll = async () => {
    if (!data) return;
    const unreadIds = data.content.filter((n) => !n.read).map((n) => n.notificationId);
    if (unreadIds.length === 0) return;

    setMarkingAll(true);
    try {
      await Promise.all(unreadIds.map((id) => markAsRead(id).catch(() => {})));

      setData((prev) =>
        prev
          ? { ...prev, content: prev.content.map((n) => ({ ...n, read: true })) }
          : prev
      );
      onChange?.();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/30 transition-opacity ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-[80] h-screen w-[380px] max-w-[90vw] bg-white shadow-2xl transition-transform duration-300
                    ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="text-xl font-bold">Notifications</div>
          <button
            aria-label="Close"
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-end px-5 py-2 border-b border-gray-100">
          <button
            onClick={handleMarkAll}
            disabled={markingAll || !data || data.content.every((n) => n.read)}
            title="모든 알림을 읽음 처리"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5
                      text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-200
                      hover:bg-gray-50 hover:text-gray-700
                      disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
          > 
            {markingAll ? (
              <Loader2 size={16} className="text-gray-400 animate-spin" />
            ) : (
              <CheckCheck size={16} className="text-gray-400" />
            )}
            <span>모두 읽기</span>
          </button>
        </div>
        <div className="flex h-[calc(100vh-60px-42px)] flex-col mt-2">
          <div className="flex-1 px-4 pb-6 overflow-y-auto ">
            {loading ? (
              <div className="py-10 text-sm text-center text-gray-500">Loading...</div>
            ) : data && data.content.length > 0 ? (
              <ul className="space-y-3">
                {data.content.map((n) => (
                  <li
                    key={n.notificationId}
                    className="relative bg-white border border-gray-200 group rounded-xl hover:bg-gray-50"
                  >
                    <button
                      className="absolute p-2 text-gray-500 transition-opacity rounded-md opacity-0 right-3 bottom-3 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 hover:bg-gray-200"
                      aria-label="Delete notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.notificationId);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      className="block w-full p-4 text-left"
                      onClick={() => handleClickItem(n)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-blue-50 p-1.5 text-blue-600">
                          {n.notificationType === "APPLICATION_RECEIVED" ? (
                            <Bell size={16} />
                          ) : (
                            <Info size={16} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${n.read ? "text-gray-600" : "text-gray-900 font-semibold"}`}>
                            {n.message}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">{timeAgo(n.createdAt)}</div>

                          {n.notificationType === 'INVITE_MINDMAP' && n.actionAvailable === true && typeof n.referenceId === 'number' && (
                            <div className="mt-3 flex items-center gap-1.5">
                              <button
                                className="px-2 py-1 text-[11px] rounded-md border bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60"
                                disabled={actingId === n.notificationId}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActingId(n.notificationId);
                                  try {
                                    await acceptInvitation(n.referenceId!);
                                    toast.success('초대를 승인했습니다.');
                                    try { await deleteNotification(n.notificationId); } catch {}
                                    setData(prev => prev ? { ...prev, content: prev.content.filter(x => x.notificationId !== n.notificationId), totalElements: Math.max(0, prev.totalElements - 1) } : prev);
                                    onChange?.();
                                  } catch (err: any) {
                                    const msg = err?.response?.data?.message || err?.message || '승인에 실패했습니다.';
                                    toast.error(msg);
                                  } finally {
                                    setActingId(null);
                                  }
                                }}
                              >승인</button>
                              <button
                                className="px-2 py-1 text-[11px] rounded-md border bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                                disabled={actingId === n.notificationId}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActingId(n.notificationId);
                                  try {
                                    await deleteInvitation(n.referenceId!);
                                    toast.success('초대를 거절했습니다.');
                                    // 서버에서도 알림 삭제
                                    try { await deleteNotification(n.notificationId); } catch {}
                                    // 로컬에서도 제거
                                    setData(prev => prev ? { ...prev, content: prev.content.filter(x => x.notificationId !== n.notificationId), totalElements: Math.max(0, prev.totalElements - 1) } : prev);
                                    onChange?.();
                                  } catch (err: any) {
                                    const msg = err?.response?.data?.message || err?.message || '거절에 실패했습니다.';
                                    toast.error(msg);
                                  } finally {
                                    setActingId(null);
                                  }
                                }}
                              >거절</button>
                            </div>
                          )}
                        </div>

                        {!n.read && (
                          <span className="flex-none inline-block w-2 h-2 mt-1 bg-yellow-300 rounded-full" />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-10 text-sm text-center text-gray-500">
                아직 알림이 없어요.
              </div>
            )}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-gray-200">
              <button
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40"
                onClick={() => load(Math.max(0, page - 1))}
                disabled={data.first || loading}
              >
                Prev
              </button>
              <div className="text-xs text-gray-500">
                {data.number + 1} / {data.totalPages}
              </div>
              <button
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40"
                onClick={() => load(Math.min(data.totalPages - 1, page + 1))}
                disabled={data.last || loading}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
