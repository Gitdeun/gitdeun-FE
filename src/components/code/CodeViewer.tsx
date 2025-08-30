"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  cn,
  EmojiType,
  EmojiTypeDetails,
  type CodeViewerProps,
  type CodeLine,
  type CodeComment,
} from "../../types.ts";
import { CommentSidebar, type SidebarThread } from "./CommentSidebar";


const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
   .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const syntaxHighlight = (text: string) => {
  const t = escapeHtml(text);
  return t
    .replace(/\b(function|const|let|var|if|else|for|while|return|class|interface|import|export|from|async|await)\b/g,'<span class="keyword">$1</span>')
    .replace(/&quot;([^&]*)&quot;/g,'<span class="string">&quot;$1&quot;</span>')
    .replace(/&#39;([^&]*)&#39;/g,'<span class="string">&#39;$1&#39;</span>')
    .replace(/\/\/.*$/gm,(m)=>`<span class="comment">${m}</span>`)
    .replace(/\b(\d+)\b/g,'<span class="number">$1</span>')
    .replace(/\b([a-zA-Z_]\w*)\s*\(/g,'<span class="function">$1</span>(');
};

/** 타입별 집계 */
const byTypeCounts = (threadsByLine: Record<number, SidebarThread[]>) => {
  const out: Partial<Record<EmojiType, number>> = {};
  Object.values(threadsByLine).forEach(list =>
    list.forEach(t => { out[t.type] = (out[t.type] ?? 0) + 1; })
  );
  return out;
};
/** 헤더 이모지(문자) 집계 */
const headerEmojiCounts = (threadsByLine: Record<number, SidebarThread[]>) => {
  const out: Record<string, number> = {};
  Object.values(threadsByLine).forEach(list =>
    list.forEach(t => {
      const e = EmojiTypeDetails[t.type].emoji;
      out[e] = (out[e] ?? 0) + 1;
    })
  );
  return out;
};

export function CodeViewer(props: CodeViewerProps) {
  const { file, onFileEmojiCountsChange } = props;

  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [lines, setLines] = useState<CodeLine[]>(file?.content ?? []);

  // ✅ 파일별 스레드 캐시 (컴포넌트 내부에서 파일간 상태 유지)
  const perFileThreadsRef = useRef<Record<string, Record<number, SidebarThread[]>>>({});

  // 현재 파일의 라인별 스레드
  const [sidebarThreads, setSidebarThreads] = useState<Record<number, SidebarThread[]>>({});

  useEffect(() => setLines(file?.content ?? []), [file]);

  // ✅ 파일이 바뀌면: 캐시에서 불러오고, 부모에 집계 반영
  useEffect(() => {
    if (!file?.id) return;
    const saved = perFileThreadsRef.current[file.id] ?? {};
    setSidebarThreads(saved);
    setSelectedLine(null);
    if (onFileEmojiCountsChange) {
      onFileEmojiCountsChange(file.id, byTypeCounts(saved));
    }
  }, [file?.id, onFileEmojiCountsChange]);

  // ✅ 스레드가 바뀌면: 현재 파일 키로 캐시에 저장 + 부모에 집계 전달
  useEffect(() => {
    if (!file?.id) return;
    perFileThreadsRef.current[file.id] = sidebarThreads;
    if (onFileEmojiCountsChange) {
      onFileEmojiCountsChange(file.id, byTypeCounts(sidebarThreads));
    }
  }, [sidebarThreads, file?.id, onFileEmojiCountsChange]);

  const activeBase = lines.find(l => l.number === selectedLine);

  // 보기 전용(전역 + 사이드바 합치기) — 전역 댓글이 있으면 합치고, 없으면 로컬만
  const activeThreads = useMemo<SidebarThread[] | undefined>(() => {
    if (!activeBase) return undefined;
    const global = (activeBase.comments ?? []) as SidebarThread[];
    const local = sidebarThreads[activeBase.number] ?? [];
    return [...global, ...local];
  }, [activeBase, sidebarThreads]);

  const fileHeaderEmoji = useMemo(() => headerEmojiCounts(sidebarThreads), [sidebarThreads]);

  if (!file) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-gray-50">
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

  /* ---- 사이드바 전용: 상위 댓글/답글 추가 (전역 영향 X) ---- */
  const addSidebarTop = (lineNo: number, content: string, type: EmojiType) => {
    const newComment: SidebarThread = {
      id: `sb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user: "나",
      content,
      type,
    };
    setSidebarThreads(prev => ({
      ...prev,
      [lineNo]: [ ...(prev[lineNo] ?? []), newComment ],
    }));
  };

  const addSidebarReply = (lineNo: number, parentId: string, content: string) => {
    const reply: CodeComment = {
      id: `sb_r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user: "나",
      content,
      type: EmojiType.QUESTION,
    };
    setSidebarThreads(prev => {
      const list = [ ...(prev[lineNo] ?? []) ];
      const i = list.findIndex(t => t.id === parentId);
      if (i >= 0) list[i] = { ...list[i], replies: [ ...(list[i].replies ?? []), reply ] };
      return { ...prev, [lineNo]: list };
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
      {/* 헤더: 파일명 + (옵션) 파일 단위 이모지 배지 */}
      <div className="shrink-0 min-h-0 p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex min-h-0 items-center justify-between">
          <h3 className="text-gray-800 font-semibold">{file.name}</h3>
          <div className="flex items-center gap-1">
            {Object.entries(fileHeaderEmoji).map(([emoji, count]) => (
              <span
                key={emoji}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-100"
              >
                <span className="mr-1">{emoji}</span>{count}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 코드 영역: 클릭 시 사이드바만 열림 (라인 옆 이모지 없음) */}
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">
          <div className="font-mono text-sm">
            {lines?.map(line => (
              <div
                key={line.number}
                className={cn("flex group relative code-line", {
                  "bg-blue-50": selectedLine === line.number,
                  "hover:bg-gray-50": selectedLine !== line.number,
                })}
                onClick={() => setSelectedLine(line.number)}
              >
                <div className="w-16 text-right pr-4 py-1 text-gray-400 bg-gray-50/30 border-r border-gray-200 select-none">
                  {line.number}
                </div>
                <div
                  className="flex-1 px-4 py-1"
                  dangerouslySetInnerHTML={{ __html: syntaxHighlight(line.content) }}
                />
              </div>
            )) || (
              <div className="p-8 text-center text-gray-500">
                <p>파일 내용을 불러올 수 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 사이드바 */}
        {activeBase && (
          <CommentSidebar
            lineNumber={activeBase.number}
            threads={activeThreads ?? []}
            onClose={() => setSelectedLine(null)}
            onAddTop={(type, content) => addSidebarTop(activeBase.number, content, type)}
            onAddReply={(parentId, content) => addSidebarReply(activeBase.number, parentId, content)}
          />
        )}
      </div>
    </div>
  );
}
