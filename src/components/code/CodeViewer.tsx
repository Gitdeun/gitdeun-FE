// components/code/CodeViewer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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

/* -------- 안전 하이라이트 (/<span 이슈 방지) -------- */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

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

export function CodeViewer(props: CodeViewerProps) {
  // onAddEmoji는 사용하지 않으므로 구조분해하지 않음(ESLint 회피)
  const { file, onFileEmojiCountsChange } = props;

  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // 전역(부모 제공) 라인
  const [lines, setLines] = useState<CodeLine[]>(file?.content ?? []);
  useEffect(() => setLines(file?.content ?? []), [file]);

  // 라인별 사이드바 전용 스레드
  const [sidebarThreads, setSidebarThreads] = useState<Record<number, SidebarThread[]>>({});

  // 현재 선택 라인
  const activeBase = lines.find((l) => l.number === selectedLine);

  // 사이드바 보기(전역 + 사이드바 합침)
  const activeThreads = useMemo<SidebarThread[] | undefined>(() => {
    if (!activeBase) return undefined;
    const global = (activeBase.comments ?? []) as SidebarThread[];
    const local = sidebarThreads[activeBase.number] ?? [];
    return [...global, ...local];
  }, [activeBase, sidebarThreads]);

  // 파일 헤더 옆 이모지(표시용 집계는 유지)
  const fileEmojiCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    Object.values(sidebarThreads).forEach((list) =>
      list.forEach((t) => {
        const e = EmojiTypeDetails[t.type].emoji;
        counts[e] = (counts[e] ?? 0) + 1;
      }),
    );
    return counts;
  }, [sidebarThreads]);

  // 부모로 타입 기준 집계 전파 (파일 리스트 옆 뱃지 용도라면 유지)
  useEffect(() => {
    if (!file?.id || !onFileEmojiCountsChange) return;
    const byType: Partial<Record<EmojiType, number>> = {};
    Object.values(sidebarThreads).forEach((list) =>
      list.forEach((t) => {
        byType[t.type] = (byType[t.type] ?? 0) + 1;
      }),
    );
    onFileEmojiCountsChange(file.id, byType);
  }, [file?.id, sidebarThreads, onFileEmojiCountsChange]);

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
  if (file.isDeleted) return <div className="p-8 text-center text-gray-500">삭제된 파일입니다.</div>;

  /* ---- 사이드바 전용: 상위 댓글/답글 추가 (전역 영향 X) ---- */
 const addSidebarTop = (lineNo: number, content: string, type: EmojiType) => {
  const newComment = {
    id: `sb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user: "나",
    content,        // ← 여기에 실제 댓글 텍스트가 들어감
    type,           // ← 타입은 별도 필드
  };
  setSidebarThreads(prev => ({
    ...prev,
    [lineNo]: [...(prev[lineNo] ?? []), newComment],
  }));
};

  const addSidebarReply = (lineNo: number, parentId: string, content: string) => {
    const reply: CodeComment = {
      id: `sb_r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user: "나",
      content,
      type: EmojiType.QUESTION,
    };
    setSidebarThreads((prev) => {
      const list = [...(prev[lineNo] ?? [])];
      const idx = list.findIndex((t) => t.id === parentId);
      if (idx >= 0) list[idx] = { ...list[idx], replies: [...(list[idx].replies ?? []), reply] };
      return { ...prev, [lineNo]: list };
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
      {/* 헤더(파일명만) */}
      <div className="shrink-0 min-h-0 p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex min-h-0 items-center justify-between">
          <h3 className="text-gray-800 font-semibold">{file.name}</h3>
          {/* 파일 헤더 옆 이모지 배지는 유지하려면 아래 블록을 남겨두세요.
              필요 없으면 이 div를 삭제하세요. */}
          <div className="flex items-center gap-1">
            {Object.entries(fileEmojiCounts).map(([emoji, count]) => (
              <span
                key={emoji}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-100"
                title="사이드바 상위 댓글 지표"
              >
                <span className="mr-1">{emoji}</span>
                {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 코드 영역: 클릭 시 사이드바만 열림 (라인 옆 이모지 전부 제거) */}
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">
          <div className="font-mono text-sm">
            {lines?.map((line) => (
              <div
                key={line.number}
                className={cn("flex group relative code-line", {
                  "bg-blue-50": selectedLine === line.number,
                  "hover:bg-gray-50": selectedLine !== line.number,
                })}
                onClick={() => setSelectedLine(line.number)}
              >
                {/* 라인 번호만 표시 (댓글 이모지 뱃지 제거) */}
                <div className="w-16 text-right pr-4 py-1 text-gray-400 bg-gray-50/30 border-r border-gray-200 select-none">
                  {line.number}
                </div>

                {/* 코드 */}
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

        {/* 우측 사이드바: 텍스트 댓글만 */}
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
