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
  status?: 'OPEN' | 'RESOLVED';
  rootCommentId?: string;
};

export function CommentSidebar({
  lineNumber,
  range,
  threads,
  onClose,
  onAddTop,
  onAddReply,
  onResolveThread,
  onChangeEmoji,
}: {
  lineNumber: number;
  range?: { start: number; end: number };
  threads: SidebarThread[];
  onClose: () => void;
  onAddTop: (type: EmojiType, content: string) => void;
  onAddReply: (parentId: string, content: string) => void;
  onResolveThread: (reviewId: string) => void | Promise<void>;
  onChangeEmoji?: (reviewId: string, commentId: string, type: EmojiType) => void | Promise<void>;
}) {
  const [newComment, setNewComment] = useState("");
  const [selectedType, setSelectedType] = useState<EmojiType>(EmojiType.QUESTION);
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const EMOJI_KEYS = Object.keys(EmojiTypeDetails) as (keyof typeof EmojiTypeDetails)[];

  const handleSubmitTop = () => {
    const text = newComment.trim();
    if (!text) return;
    onAddTop(selectedType as EmojiType, text);
    setNewComment("");
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [threads]);

  const headerLabel =
    range && range.start !== range.end
      ? `${range.start}~${range.end} 의견`
      : `Line ${lineNumber} 의견`;

  return (
    <div className="flex flex-col h-full min-w-0 min-h-0 border-l border-blue-200 w-96 bg-gray-50">
      <div className="flex items-center justify-between p-4 border-b border-blue-200 shrink-0">
        <h4 className="font-semibold text-blue-900">{headerLabel}</h4>
        <Button variant="ghost" size="sm" className="w-6 h-6 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div
        ref={listRef}
        className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto overscroll-contain"
      >
        {threads.length > 0 ? (
          threads.map((t) => {
            const details = EmojiTypeDetails[t.type];
            const isOpenReply = replyOpenFor === t.id;
            const isClosed = (t.status ?? 'OPEN') === 'RESOLVED';

            return (
              <div key={t.id} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                <div className="flex items-center mb-2">
                  {!isClosed && (
                    <span className={cn("text-sm rounded-full px-2 py-0.5 mr-2", details.className)}>
                      {details.emoji} {details.label}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-gray-800">{t.user}</p>
                  {isClosed && (
                    <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      댓글 닫힘
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.content}</p>

                {t.replies && t.replies.length > 0 && (
                  <div className="pl-3 mt-3 space-y-2 border-l-2 border-gray-200">
                    {t.replies.map((r) => (
                      <div key={r.id} className="text-sm">
                        <p className="font-medium text-gray-700">{r.user}</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!isClosed && t.rootCommentId && (
                  <div className="mt-2">
                    <div className="text-[11px] text-gray-500 mb-1">유형 변경</div>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_KEYS.map((key) => {
                        const k = key as EmojiType;
                        const active = t.type === k;
                        return (
                          <Button
                            key={k}
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onChangeEmoji?.(t.id, t.rootCommentId!, k)}
                            title={`${EmojiTypeDetails[k].label}로 변경`}
                            aria-label={`${EmojiTypeDetails[k].label}로 변경`}
                            className={cn(
                              "w-8 h-8 rounded-full p-0",
                              active
                                ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            <span className="text-base leading-none">
                              {EmojiTypeDetails[k].emoji}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  {isClosed ? (
                    <div className="flex items-center justify-end" />
                  ) : !isOpenReply ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setReplyOpenFor(t.id)}
                      >
                        답글 작성
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs "
                        onClick={async () => {
                          await onResolveThread(t.id);
                          if (replyOpenFor === t.id) setReplyOpenFor(null);
                        }}
                      >
                        댓글 닫기
                      </Button>
                    </div>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyOpenFor(null)}
                        >
                          취소
                        </Button>
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="mt-4 text-sm text-center text-gray-500">
            이 라인의 첫 댓글을 남겨보세요.
          </p>
        )}
      </div>

      <div className="p-4 bg-white border-t border-blue-200 shrink-0">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {EMOJI_KEYS.map((key) => {
            const k = key as unknown as EmojiType;
            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => setSelectedType(k)}
                className={cn(
                  "text-xs justify-start",
                  selectedType === k ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "text-gray-600"
                )}
              >
                <span className="mr-2">{EmojiTypeDetails[k].emoji}</span>
                {EmojiTypeDetails[k].label}
              </Button>
            );
          })}
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
