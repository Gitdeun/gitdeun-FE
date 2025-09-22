"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MindmapDetailView } from './MindmapDetailView';
import { TechStackModal } from '../../components/modal/TechStackModal';
import type { Mindmap, MindMapDataNode } from '../../types';
import { toast } from 'sonner';
import { createMindmapAsync, getMindmapDetail, type MindmapDetailResponse } from '../../api/mindmap';
import { getVisitHistory, getPinnedVisits, pinVisit, unpinVisit, connectHistorySSE, throttle, type VisitHistoryItem } from '../../api/visitHistory';
import httpClient from '../../api/httpClient';

const MindmapPage: React.FC = () => {
  const [githubLink, setGithubLink] = useState<string>('');
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [error, setError] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const { id: idParam } = useParams();

  const location = useLocation();
  const navigate = useNavigate();
  const [openTechModal, setOpenTechModal] = useState<boolean>(Boolean(location.state?.showTechStackModal));
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [visitPage, setVisitPage] = useState(0);
  const [visitSize] = useState(4);
  const [visitItems, setVisitItems] = useState<VisitHistoryItem[]>([]);
  const [visitTotalPages, setVisitTotalPages] = useState(0);
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitError, setVisitError] = useState<string | null>(null);

  // 핀 상태
  const [pinned, setPinned] = useState<VisitHistoryItem[]>([]);
  const pinnedIdSet = useMemo(() => new Set(pinned.map(p => p.mindmapId)), [pinned]);

  useEffect(() => {
    if (location.state?.showTechStackModal) {
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // 상세 데이터 상태 (idParam 있을 때)
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailMindmap, setDetailMindmap] = useState<Mindmap | null>(null);

  // 그래프 -> 트리 변환기
  function graphToTree(resp: MindmapDetailResponse): MindMapDataNode {
    const graph = resp?.mindmapGraph;
    if (!graph || !Array.isArray(graph.nodes)) {
      return { node: '(empty)', related_files: [], children: [] };
    }
    const nodes = new Map(graph.nodes.map(n => [n.key, n]));
    const childrenMap = new Map<string, string[]>();
    const hasParent = new Set<string>();
    for (const e of graph.edges || []) {
      if (!e?.containmentEdge) continue;
      if (!nodes.has(e.from) || !nodes.has(e.to)) continue;
      const arr = childrenMap.get(e.from) ?? [];
      arr.push(e.to);
      childrenMap.set(e.from, arr);
      hasParent.add(e.to);
    }
    let rootKey: string | undefined;
    for (const n of graph.nodes) {
      const hasOut = childrenMap.has(n.key);
      if (!hasParent.has(n.key) && (hasOut || rootKey === undefined)) {
        rootKey = n.key;
      }
    }
    if (!rootKey) {
      rootKey = graph.nodes[0]?.key;
    }
    const build = (key: string): MindMapDataNode => {
      const n = nodes.get(key);
      if (!n) return { node: '(unknown)', related_files: [], children: [] };
      const kids = (childrenMap.get(key) || [])
        .filter(childKey => nodes.has(childKey))
        .map(build);
      return { node: n.label ?? '(no label)', related_files: n.related_files || [], children: kids };
    };
    return build(rootKey!);
  }

  useEffect(() => {
    const baseUrl = (httpClient.defaults.baseURL as string) || '';
    if (!baseUrl) return;
    const refreshPinnedThrottled = throttle(async () => {
      try {
        const data = await getPinnedVisits();
        setPinned(data);
      } catch {}
    }, 800);

    // keep latest page/size in refs for SSE refresh
    const pageRef = { current: visitPage } as { current: number };
    const sizeRef = { current: visitSize } as { current: number };
    // update on change
    pageRef.current = visitPage;
    sizeRef.current = visitSize;

    const refreshVisitsThrottled = throttle(async () => {
      try {
        const res = await getVisitHistory({ page: pageRef.current, size: sizeRef.current });
        setVisitItems(res.content);
        setVisitTotalPages(res.totalPages);
      } catch {}
    }, 800);

    const es = connectHistorySSE({
      baseUrl,
      onMessage: (msg) => {
        const t = msg?.type;
        if (!t) return;
        if (t === 'PIN_ADDED' || t === 'PIN_REMOVED' || t === 'REFRESH_PINS') {
          refreshPinnedThrottled();
        }
        // refresh visits on server-side lastVisitedAt update events
        if (t === 'VISIT_UPDATED' || t === 'VISIT_ADDED' || t === 'REFRESH_VISITS') {
          refreshVisitsThrottled();
        }
      },
      onError: () => {
      },
      withCredentials: true,
    });
    return () => {
      es.close();
    };
  }, [visitPage, visitSize]);

  const lastFetchedIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!idParam) return;
    const idNum = Number(idParam);
    if (Number.isNaN(idNum)) return;
    // StrictMode에서 mount->unmount->mount로 인해 중복 호출 방지
    if (lastFetchedIdRef.current === idNum && detailMindmap) return;
    lastFetchedIdRef.current = idNum;
    const abort = new AbortController();
    setDetailLoading(true);
    setDetailError(null);
    setDetailMindmap(null);
    getMindmapDetail(idNum)
      .then((resp) => {
        if (abort.signal.aborted) return;
        const data = graphToTree(resp);
        const mm: Mindmap = {
          id: resp.mindmapId,
          title: resp.title,
          link: undefined,
          updated: resp.updatedAt?.slice(0,10)?.replace(/-/g, '.') ?? undefined,
          pinned: false,
          data,
        };
        setDetailMindmap(mm);
      })
      .catch((e: any) => {
        if (abort.signal.aborted) return;
        const msg = e?.response?.data?.message || e?.message || '상세 정보를 불러오지 못했습니다.';
        setDetailError(msg);
      })
      .finally(() => { if (!abort.signal.aborted) setDetailLoading(false); });
    return () => abort.abort();
  }, [idParam]);

  // 방문 기록 불러오기
  useEffect(() => {
    const run = async () => {
      setVisitLoading(true);
      setVisitError(null);
      try {
        const data = await getVisitHistory({ page: visitPage, size: visitSize });
        setVisitItems(data.content);
        setVisitTotalPages(data.totalPages);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || '방문 기록을 불러오지 못했습니다.';
        setVisitError(msg);
      } finally {
        setVisitLoading(false);
      }
    };
    void run();
  }, [visitPage, visitSize, location.pathname, location.state?.refreshVisits]);

  // 핀 목록 불러오기
  useEffect(() => {
    const loadPinned = async () => {
      try {
        const data = await getPinnedVisits();
        setPinned(data);
      } catch (e) {
      }
    };
    void loadPinned();
  }, []);

  const togglePin = async (mindmapId: number) => {
    try {
      if (pinnedIdSet.has(mindmapId)) {
        await unpinVisit(mindmapId);
        const removed = pinned.find(p => p.mindmapId === mindmapId) || null;
        setPinned(prev => prev.filter(p => p.mindmapId !== mindmapId));
        if (removed && !visitItems.some(v => v.mindmapId === mindmapId)) {
          setVisitItems(prev => [removed, ...prev]);
        }
        toast.success('핀 해제되었습니다.');
      } else {
        await pinVisit(mindmapId);
        const found = visitItems.find(v => v.mindmapId === mindmapId);
        if (found) setPinned(prev => [found, ...prev]);
        // remove from main grid immediately
        setVisitItems(prev => prev.filter(v => v.mindmapId !== mindmapId));
        toast.success('핀으로 등록되었습니다.');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '핀 처리 중 오류가 발생했습니다.';
      toast.error(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return; // guard double submit
    if (!githubLink.trim()) {
      setError('GitHub 링크를 입력해주세요.');
      return;
    }
    setError('');
    setIsCreating(true);
    try {
      const res = await createMindmapAsync(githubLink.trim(), prompt);
      toast.success(res.message || '마인드맵 생성 요청이 접수되었습니다.');

      // SSE 구독: 알림 기반으로 생성 완료 시 상세 페이지로 이동
      const baseUrl = (httpClient.defaults.baseURL as string) || '';
      if (baseUrl) {
        const es = new EventSource(`${baseUrl.replace(/\/$/, '')}/notifications/sse`, { withCredentials: true });
        const closeES = () => { try { es.close(); } catch {} };
        es.onmessage = (event: MessageEvent) => {
          try {
            const notification = JSON.parse(event.data) as {
              notificationId?: number;
              message?: string;
              notificationType?: string;
              referenceId?: number; // mindmapId
              createdAt?: string;
            };
            const type = notification.notificationType || '';
            const msg = notification.message || '';
            const refId = notification.referenceId;
            // 서버 타입 명시: CREATE_MINDMAP(생성), UPDATE_MINDMAP(갱신)
            const createDone =
              type === 'CREATE_MINDMAP' ||
              // fallback (서버 메시지 포맷이 다른 경우까지 커버)
              /(생성|만들기|create).*(완료|complete|done)/i.test(msg) ||
              type === 'MINDMAP_CREATED' ||
              type === 'MINDMAP_CREATE_COMPLETED' ||
              (type === 'SYSTEM_UPDATE' && /생성/.test(msg));
            if (createDone && typeof refId === 'number' && !Number.isNaN(refId)) {
              closeES();
              navigate(`/mindmap/${refId}`);
            }
          } catch {
            // ignore parse errors
          }
        };
        es.onerror = () => {
          // SSE 오류는 조용히 무시
        };
      }

      const newMindmap: Mindmap = {
        id: Date.now(),
        link: githubLink.trim(),
        title: prompt || `새 마인드맵 ${mindmaps.length + 1}`,
        updated: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
        pinned: false,
        eta: res.status === 'PROCESSING' ? '생성 중' : undefined,
        data: { node: prompt || `새 마인드맵 루트`, related_files: [], children: [] }
      };
      setMindmaps(prev => [newMindmap, ...prev]);
      setGithubLink('');
      setPrompt('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '요청 중 오류가 발생했습니다.';
      toast.error(msg);
      setError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  if (idParam) {
    if (detailLoading) return <div className="p-6">불러오는 중…</div>;
    if (detailError) return <div className="p-6 text-red-600">{detailError}</div>;
    if (!detailMindmap) return <div className="p-6">데이터가 없습니다.</div>;
    return <MindmapDetailView mindmap={detailMindmap} onBack={() => navigate('/mindmap', { state: { refreshVisits: Date.now() } })} />;
  }

  return (
    <div className="font-sans">
      <div className="bg-[#DDEFF9] flex flex-col items-center p-4 pt-16 pb-12 sm:pt-20">
        <div className="w-full max-w-5xl">
          <h1 className="text-4xl font-bold text-gray-800 text-center mb-12">
            GitHub 레포지토리, 한눈에 펼쳐지는 마인드맵
          </h1>
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
            <div className="w-full flex items-center bg-white/70 rounded-full p-2 shadow-lg shadow-sky-200/80 mb-8 gap-3 h-20 border border-white">
              <input
                type="text"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="깃허브 레포지토리 링크를 입력해주세요"
                className="flex-grow p-4 h-full bg-transparent focus:outline-none text-gray-700 text-xl placeholder:text-gray-400"
                disabled={isCreating}
              />
              <button
                type="submit"
                className="bg-sky-500 text-white font-bold py-4 px-10 h-full rounded-full hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                disabled={isCreating}
              >
                {isCreating ? '생성 중…' : '생성하기'}
              </button>
            </div>
            <input
              className="w-full max-w-4xl p-4 bg-white/50 rounded-2xl text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors placeholder:text-sky-800/60 border border-white/80"
              placeholder="마인드맵 제목을 작성해주세요. 미입력시, 기본 제목으로 생성합니다."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isCreating}
            />
          </form>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </div>
      </div>

      <div className="bg-white w-full flex-grow flex flex-col items-center py-12">
        <div className="w-full max-w-5xl px-4">
          {pinned.length > 0 && (
            <section className="w-full mb-12">
              <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">Pinned</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pinned.map(item => (
                  <div
                    key={item.visitHistoryId}
                    className="flex flex-col justify-between p-6 rounded-2xl bg-white transition-all duration-300 cursor-pointer border border-slate-200/80 shadow-md hover:shadow-xl hover:-translate-y-1"
                    onClick={() => {
                      const now = new Date().toISOString();
                      setPinned(prev => prev.map(p => p.mindmapId === item.mindmapId ? { ...p, lastVisitedAt: now } : p));
                      setVisitItems(prev => prev.map(v => v.mindmapId === item.mindmapId ? { ...v, lastVisitedAt: now } : v));
                      navigate(`/mindmap/${item.mindmapId}`);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-400 truncate mb-2">{item.repoUrl}</p>
                      <button
                        className="text-sky-500 hover:text-sky-600"
                        onClick={(e) => { e.stopPropagation(); togglePin(item.mindmapId); }}
                        aria-label="핀 해제"
                      >
                        {/* filled pin */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M14 4v6.5a2.5 2.5 0 0 1-2.5 2.5h-1A2.5 2.5 0 0 1 8 10.5V4h6Zm-3 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 my-1 truncate">{item.mindmapTitle}</h3>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm text-sky-700">{new Date(item.lastVisitedAt).toLocaleString()}</p>
                      <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-2 px-2">Mind map</h2>
            {visitLoading ? (
              <div className="p-6 text-center text-gray-500">불러오는 중…</div>
            ) : visitError ? (
              <div className="p-4 border rounded-xl bg-red-50 text-red-600">{visitError}</div>
            ) : visitItems.length === 0 ? (
              <div className="p-6 text-center text-gray-500 border rounded-xl bg-gray-50">표시할 마인드맵이 없습니다.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {visitItems.map((it) => (
                    <div
                      key={it.visitHistoryId}
                      className="flex flex-col justify-between p-6 rounded-2xl bg-white transition-all duration-300 cursor-pointer border border-slate-200/80 shadow-md hover:shadow-xl hover:-translate-y-1"
                      onClick={() => {
                        const now = new Date().toISOString();
                        setVisitItems(prev => prev.map(v => v.mindmapId === it.mindmapId ? { ...v, lastVisitedAt: now } : v));
                        setPinned(prev => prev.map(p => p.mindmapId === it.mindmapId ? { ...p, lastVisitedAt: now } : p));
                        navigate(`/mindmap/${it.mindmapId}`);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-gray-400 truncate mb-2">{it.repoUrl}</p>
                        <button
                          className={pinnedIdSet.has(it.mindmapId) ? 'text-sky-500 hover:text-sky-600' : 'text-slate-400 hover:text-slate-600'}
                          onClick={(e) => { e.stopPropagation(); togglePin(it.mindmapId); }}
                          aria-label={pinnedIdSet.has(it.mindmapId) ? '핀 해제' : '핀 등록'}
                        >
                          {pinnedIdSet.has(it.mindmapId) ? (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M14 4v6.5a2.5 2.5 0 0 1-2.5 2.5h-1A2.5 2.5 0 0 1 8 10.5V4h6Zm-3 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 4h6v6.5A2.5 2.5 0 0 1 12.5 13h-1A2.5 2.5 0 0 1 9 10.5V4Zm3 11v5" strokeLinecap="round"/></svg>
                          )}
                        </button>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 my-1 truncate">{it.mindmapTitle}</h3>
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-sky-700 ">{new Date(it.lastVisitedAt).toLocaleString()}</p>
                        <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <button
                    className="px-3 py-1.5 text-xs rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50 disabled:hover:bg-sky-50"
                    disabled={visitPage === 0}
                    onClick={() => setVisitPage((p) => Math.max(0, p - 1))}
                  >이전</button>
                  <span className="text-xs px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    {visitPage + 1} / {Math.max(1, visitTotalPages)}
                  </span>
                  <button
                    className="px-3 py-1.5 text-xs rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50 disabled:hover:bg-sky-50"
                    disabled={visitPage + 1 >= visitTotalPages}
                    onClick={() => setVisitPage((p) => p + 1)}
                  >다음</button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <TechStackModal isOpen={openTechModal} onClose={() => setOpenTechModal(false)} />
    </div>
  );
};

export default MindmapPage;