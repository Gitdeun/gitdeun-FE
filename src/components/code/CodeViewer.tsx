"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, X, Trash2 } from "lucide-react";
import { CommentSidebar, type SidebarThread } from "./CommentSidebar";
import {
  cn,
  EmojiType,
  EmojiTypeDetails,
  type CodeViewerProps,
  type CodeLine,
  type CodeComment,
} from "../../types.ts";

/** Drawer에 표시할 참조 마커 */
type RefMarker = {
  referenceId: number;
  filePath: string;
  startLine: number;
  endLine: number;
  emojiType?: EmojiType;
};

type EmojiCounts = Partial<Record<EmojiType, number>>;

type CodeViewerWithSelectionProps = CodeViewerProps & {
  onCreateCodeReference?: (payload: { filePath: string; startLine: number; endLine: number }) => Promise<void> | void;
  currentReferenceId?: number | null;
  onAddRefReview?: (content: string, type: EmojiType, files?: File[]) => Promise<void> | void;
  onSidebarClose?: () => void;
  onChangeRefEmoji?: (reviewId: string, commentId: string, type: EmojiType) => void | Promise<void>;

  referenceMarkers?: RefMarker[];
  onSelectReference?: (m: RefMarker) => void;

  referenceThreads?: (CodeComment & { status?: 'OPEN' | 'RESOLVED' })[];

  onDeleteReference?: (refId: number) => Promise<void> | void;

  onResolveReview?: (reviewId: string) => Promise<void> | void;
  onReplyRefReview?: (reviewId: string, content: string) => Promise<void> | void;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const syntaxHighlight = (text: string) => {
  const t = escapeHtml(text);
  return t
    .replace(
      /\b(function|const|let|var|if|else|for|while|return|class|interface|import|export|from|async|await)\b/g,
      '<span class="keyword">$1</span>',
    )
    .replace(/&quot;([^&]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
    .replace(/&#39;([^&]*)&#39;/g, "<span class=\"string\">&#39;$1&#39;</span>")
    .replace(/\/\/.*$/gm, (m) => `<span class="comment">${m}</span>`)
    .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
    .replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="function">$1</span>(');
};

const byTypeCounts = (threadsByLine: Record<number, SidebarThread[]>) => {
  const out: Partial<Record<EmojiType, number>> = {};
  Object.values(threadsByLine).forEach((list) =>
    list.forEach((t) => {
      out[t.type] = (out[t.type] ?? 0) + 1;
    }),
  );
  return out as EmojiCounts;
};
const headerEmojiCounts = (threadsByLine: Record<number, SidebarThread[]>) => {
  const out: Record<string, number> = {};
  Object.values(threadsByLine).forEach((list) =>
    list.forEach((t) => {
      const e = EmojiTypeDetails[t.type].emoji;
      out[e] = (out[e] ?? 0) + 1;
    }),
  );
  return out;
};

export function CodeViewer(props: CodeViewerWithSelectionProps) {
  const {
    file,
    onFileEmojiCountsChange,
    onCreateCodeReference,
    onAddComment,
    currentReferenceId,
    onAddRefReview,
    onSidebarClose,
    referenceMarkers = [],
    onSelectReference,
    referenceThreads = [],
    onDeleteReference,
    onResolveReview,
    onReplyRefReview,
  } = props;

  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [lines, setLines] = useState<CodeLine[]>(file?.content ?? []);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const selection = useMemo(() => {
    if (dragStart == null || dragEnd == null) return null;
    const start = Math.min(dragStart, dragEnd);
    const end = Math.max(dragStart, dragEnd);
    return { start, end };
  }, [dragStart, dragEnd]);

  const [persistentSelection, setPersistentSelection] = useState<{ start: number; end: number } | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const startDrag = (lineNo: number) => {
    setIsDragging(true);
    setDragStart(lineNo);
    setDragEnd(lineNo);
    setPersistentSelection(null);
  };
  const updateDrag = (lineNo: number) => {
    if (!isDragging) return;
    setDragEnd(lineNo);
  };

  useEffect(() => {
    const handleUp = async () => {
      if (!isDragging) return;
      setIsDragging(false);

      if (file && selection) {
        setPersistentSelection(selection);
        setSelectedLine(selection.start);

        const filePath = (file.path || file.name || "").replace(/^\//, "");
        try {
          await onCreateCodeReference?.({
            filePath,
            startLine: selection.start,
            endLine: selection.end,
          });
        } catch (e) {
          console.error(e);
        }
      }

      setDragStart(null);
      setDragEnd(null);
    };

    document.addEventListener("mouseup", handleUp);
    return () => document.removeEventListener("mouseup", handleUp);
  }, [isDragging, selection, file, onCreateCodeReference]);

  const perFileThreadsRef = useRef<Record<string, Record<number, SidebarThread[]>>>({});
  const [sidebarThreads, setSidebarThreads] = useState<Record<number, SidebarThread[]>>({});

  useEffect(() => setLines(file?.content ?? []), [file]);

  useEffect(() => {
    if (!file?.id) return;
    const saved = perFileThreadsRef.current[file.id] ?? {};
    setSidebarThreads(saved);
    setSelectedLine(null);
    setPersistentSelection(null);
    onFileEmojiCountsChange?.(file.id, byTypeCounts(saved));
  }, [file?.id, onFileEmojiCountsChange]);

  useEffect(() => {
    if (!file?.id) return;
    perFileThreadsRef.current[file.id] = sidebarThreads;
    onFileEmojiCountsChange?.(file.id, byTypeCounts(sidebarThreads));
  }, [sidebarThreads, file?.id, onFileEmojiCountsChange]);

  const activeBase = lines.find((l) => l.number === selectedLine);

  const localThreads = useMemo<SidebarThread[] | undefined>(() => {
    if (!activeBase) return undefined;
    const global = (activeBase.comments ?? []) as unknown as SidebarThread[];
    const local = sidebarThreads[activeBase.number] ?? [];
    return [...(global ?? []), ...local];
  }, [activeBase, sidebarThreads]);

  const displayedThreads: SidebarThread[] =
    (currentReferenceId && referenceThreads.length > 0
      ? (referenceThreads as unknown as SidebarThread[])
      : (localThreads ?? [])) as SidebarThread[];

  const fileHeaderEmoji = useMemo(() => headerEmojiCounts(sidebarThreads), [sidebarThreads]);

  if (!file) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0 bg-gray-50">
        <div className="text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>파일을 선택해주세요</p>
        </div>
      </div>
    );
  }
  if (file.isDeleted) {
    return <div className="p-8 text-center text-gray-500">삭제된 파일입니다.</div>;
  }

  const addSidebarTop = (lineNo: number, content: string, type: EmojiType) => {
    const newComment: SidebarThread = {
      id: `sb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user: "나",
      content,
      type,
      status: 'OPEN',
    };
    setSidebarThreads((prev) => ({
      ...prev,
      [lineNo]: [...(prev[lineNo] ?? []), newComment],
    }));
    if (currentReferenceId && onAddRefReview) {
      void onAddRefReview(content, type);
    } else {
      onAddComment?.(lineNo, content, type);
    }
  };

  const addSidebarReply = (lineNo: number, parentId: string, content: string) => {
    const reply: SidebarThread = {
      id: `sb_r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user: "나",
      content,
      type: EmojiType.QUESTION,
    };
    setSidebarThreads((prev) => {
      const list = [...(prev[lineNo] ?? [])];
      const i = list.findIndex((t) => t.id === parentId);
      if (i >= 0) list[i] = { ...list[i], replies: [...(list[i].replies ?? []), reply] };
      return { ...prev, [lineNo]: list };
    });
  };

  const isInDrag = (n: number) => selection && n >= selection.start && n <= selection.end;
  const isInPersistent = (n: number) =>
    persistentSelection && n >= persistentSelection.start && n <= persistentSelection.end;

  const jumpToMarker = (m: RefMarker) => {
    setDrawerOpen(false);
    setPersistentSelection({ start: m.startLine, end: m.endLine });
    setSelectedLine(m.startLine);
    onSelectReference?.(m);
  };

  return (
    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden bg-white">
      {/* 헤더 */}
      <div className="min-h-0 p-4 border-b border-gray-200 shrink-0 bg-gray-50/50">
        <div className="flex items-center justify-between min-h-0">
          <h3 className="font-semibold text-gray-800">{file.name}</h3>
          <div className="flex items-center gap-2">
            {Object.entries(fileHeaderEmoji).map(([emoji, count]) => (
              <span
                key={emoji}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-100"
              >
                <span className="mr-1">{emoji}</span>
                {count}
              </span>
            ))}

            <button
              onClick={() => setDrawerOpen(true)}
              className="ml-2 inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:shadow-sm transition"
              title="이 파일의 코드 참조 목록"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {`참조목록${(referenceMarkers?.length ?? 0) > 0 ? ` ${referenceMarkers!.length}개` : ""}`}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto select-none">
          <div className="font-mono text-sm">
            {lines?.map((line) => {
              const yellow = isInDrag(line.number) || isInPersistent(line.number);
              return (
                <div
                  key={line.number}
                  className={cn(
                    "flex group relative code-line",
                    yellow ? "bg-yellow-50" : selectedLine === line.number ? "bg-blue-50" : "hover:bg-gray-50",
                  )}
                  onMouseDown={() => startDrag(line.number)}
                  onMouseEnter={() => updateDrag(line.number)}
                  onClick={() => {
                    if (!isDragging) setSelectedLine(line.number);
                  }}
                >
                  <div className="w-16 py-1 pr-4 text-right text-gray-400 border-r border-gray-200 select-none bg-gray-50/30">
                    {line.number}
                  </div>
                  <div
                    className="flex-1 px-4 py-1"
                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(line.content) }}
                  />
                </div>
              );
            }) || (
              <div className="p-8 text-center text-gray-500">
                <p>파일 내용을 불러올 수 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 사이드바 */}
        {selectedLine != null && (
          <CommentSidebar
            lineNumber={selectedLine}
            range={
              persistentSelection && persistentSelection.start !== persistentSelection.end
                ? persistentSelection
                : undefined
            }
            threads={displayedThreads}
            onClose={() => {
              setSelectedLine(null);
              setPersistentSelection(null);
              onSidebarClose?.();
            }}
            onAddTop={(type, content) => addSidebarTop(selectedLine, content, type)}
            onAddReply={(parentId, content) => {
              if (currentReferenceId && referenceThreads.length > 0 && onReplyRefReview) {
                onReplyRefReview(parentId, content); 
              } else {
                addSidebarReply(selectedLine, parentId, content);
              }
            }}
            onResolveThread={(rid) => onResolveReview?.(rid)}
            onChangeEmoji={(reviewId, commentId, type) =>
              props.onChangeRefEmoji?.(reviewId, commentId, type)
            }
          />
        )}

        {drawerOpen && (
          <div className="absolute top-0 right-0 flex flex-col h-full bg-white border-l border-gray-200 shadow-xl w-80">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div className="font-semibold text-gray-800">이 파일의 코드 참조</div>
              <button onClick={() => setDrawerOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(referenceMarkers ?? []).length === 0 ? (
                <p className="p-4 text-sm text-gray-500">아직 생성된 참조 블록이 없습니다.</p>
              ) : (
                <ul className="p-2 space-y-2">
                  {referenceMarkers
                    .slice()
                    .sort((a, b) => a.startLine - b.startLine)
                    .map((m) => {
                      const label =
                        m.startLine === m.endLine ? `${m.startLine} 블록` : `${m.startLine}~${m.endLine} 블록`;
                      const det = m.emojiType ? EmojiTypeDetails[m.emojiType] : null;

                      return (
                        <li key={m.referenceId} className="group">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => jumpToMarker(m)}
                              className="flex-1 px-3 py-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none"
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-800">{label}</div>
                              </div>
                              {det && (
                                <div className="mt-1 inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  <span className="mr-1">{det.emoji}</span>
                                  {det.label}
                                </div>
                              )}
                            </button>

                            <button
                              title="참조 삭제"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!onDeleteReference) return;
                                const ok = window.confirm("이 참조 블록을 삭제할까요?");
                                if (!ok) return;
                                await onDeleteReference(m.referenceId);
                              }}
                              className="p-2 text-red-500 border border-transparent rounded-lg shrink-0 hover:border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
