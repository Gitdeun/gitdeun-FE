// components/code/CommentSidebar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button.tsx";
import { Textarea } from "../ui/textarea.tsx";
import {
  cn,
  EmojiType,
  EmojiTypeDetails,
  type CodeComment,
} from "../../types.ts";

export type SidebarThread = CodeComment & {
  replies?: CodeComment[];
};

export function CommentSidebar({
  lineNumber,
  threads,
  onClose,
  onAddTop,
  onAddReply,
}: {
  lineNumber: number;
  threads: SidebarThread[];
  onClose: () => void;
  onAddTop: (type: EmojiType, content: string) => void;
  onAddReply: (parentId: string, content: string) => void;
}) {
  const [newComment, setNewComment] = useState("");
  const [selectedType, setSelectedType] = useState<EmojiType>(EmojiType.QUESTION);
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const EMOJI_KEYS = Object.keys(EmojiTypeDetails) as EmojiType[];

  const handleSubmitTop = () => {
    const text = newComment.trim();
    if (!text) return;
    onAddTop(selectedType, text);
    setNewComment("");
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [threads.length]);

  return (
    // ✅ 핵심: min-h-0 + h-full + min-w-0 (부모가 flex 컨테이너일 때 꼭 필요)
    <div className="w-96 min-h-0 h-full min-w-0 border-l border-blue-200 bg-gray-50 flex flex-col">
      <div className="shrink-0 p-4 border-b border-blue-200 flex justify-between items-center">
        <h4 className="font-semibold text-blue-900">Line {lineNumber} 의견</h4>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* ✅ 리스트 영역: flex-1 + min-h-0 + overflow-y-auto */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4"
      >
        {threads.length > 0 ? (
          threads.map((t) => {
            const details = EmojiTypeDetails[t.type];
            const isOpen = replyOpenFor === t.id;
            return (
              <div key={t.id} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                <div className="flex items-center mb-2">
                  <span className={cn("text-sm rounded-full px-2 py-0.5 mr-2", details.className)}>
                    {details.emoji} {details.label}
                  </span>
                  <p className="font-semibold text-sm text-gray-800">{t.user}</p>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.content}</p>

                {t.replies && t.replies.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-gray-200 space-y-2">
                    {t.replies.map((r) => (
                      <div key={r.id} className="text-sm">
                        <p className="font-medium text-gray-700">{r.user}</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3">
                  {!isOpen ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setReplyOpenFor(t.id)}
                    >
                      답글 작성
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        value={replyTexts[t.id] ?? ""}
                        onChange={(e) =>
                          setReplyTexts((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        placeholder="답글을 입력하세요…"
                        className="min-h-[72px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const text = (replyTexts[t.id] ?? "").trim();
                            if (!text) return;
                            onAddReply(t.id, text);
                            setReplyTexts((prev) => ({ ...prev, [t.id]: "" }));
                            setReplyOpenFor(null);
                          }}
                        >
                          등록
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setReplyOpenFor(null)}>
                          취소
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 text-center mt-4">
            이 라인의 첫 댓글을 남겨보세요.
          </p>
        )}
      </div>

      {/* 푸터는 고정 높이라 shrink-0 */}
      <div className="shrink-0 p-4 border-t border-blue-200 bg-white">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {EMOJI_KEYS.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => setSelectedType(key)}
              className={cn(
                "text-xs justify-start",
                selectedType === key ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "text-gray-600"
              )}
            >
              <span className="mr-2">{EmojiTypeDetails[key].emoji}</span>
              {EmojiTypeDetails[key].label}
            </Button>
          ))}
        </div>

        <Textarea
          placeholder={`${EmojiTypeDetails[selectedType].label} 내용을 입력하세요...`}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2"
        />
        <Button onClick={handleSubmitTop} className="w-full bg-blue-600 hover:bg-blue-700">
          댓글 달기
        </Button>
      </div>
    </div>
  );
}
