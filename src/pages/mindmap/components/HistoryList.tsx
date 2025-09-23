import { useEffect, useState } from 'react';
import type { PromptHistoryItem, PageResponse } from '../../../api/mindmap';
import { getMindmapPromptHistories } from '../../../api/mindmap';

export function HistoryList({ mapId }: { mapId: number; onUsePrompt?: (p: string) => void }) {
  const [items, setItems] = useState<PromptHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeAgo = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}시간 전`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}일 전`;
    return d.toLocaleDateString();
  };

  useEffect(() => { setPage(0); }, [mapId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMindmapPromptHistories(mapId, { page, size });
        setItems((data as PageResponse<PromptHistoryItem>).content);
        setTotalPages(Math.max(1, Number((data as PageResponse<PromptHistoryItem>).totalPages ?? 1)));
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || '히스토리를 불러오지 못했습니다.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [mapId, page, size]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-4 py-3.5 border-b border-neutral-200 bg-white/90 sticky top-0 z-10 flex items-center justify-between">
        <div className="text-sm font-semibold text-sky-700">최근 프롬프트</div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        {loading ? (
          <div className="p-3 text-sm text-neutral-500">불러오는 중…</div>
        ) : error ? (
          <div className="p-3 text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-3 text-sm text-neutral-500">기록이 없습니다.</div>
        ) : (
          <ul className="space-y-2">
            {items.map(h => (
              <li key={h.historyId}>
                <div className="w-full p-3 text-left transition bg-white border rounded-lg group border-neutral-200 hover:bg-sky-50/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${h.applied ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                      <span>{timeAgo(h.createdAt)}</span>
                    </div>
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-neutral-800 line-clamp-2">{h.summary || h.prompt}</div>
                  <div className="text-[12px] text-neutral-600 line-clamp-2">{h.prompt}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 p-2">
        <button
          className="px-3 py-1.5 text-xs rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50 disabled:hover:bg-sky-50"
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))}
        >이전</button>
        <span className="px-2 py-1 text-xs border rounded-full bg-sky-50 text-sky-700 border-sky-200">
          {page + 1} / {Math.max(1, totalPages)}
        </span>
        <button
          className="px-3 py-1.5 text-xs rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50 disabled:hover:bg-sky-50"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage(p => p + 1)}
        >다음</button>
      </div>
    </div>
  );
}
