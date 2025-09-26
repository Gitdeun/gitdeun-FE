import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { CommentThread } from './CommentThread';
import { EmojiType, EmojiTypeDetails } from '../../types';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';

type Comment = any;

type Props = {
  comments: Comment[];
  onAddComment: (content: string, type?: EmojiType) => void;
  onReply: (parentId: string, content: string) => void;
  onEdit: (id: string, txt: string) => void;
  onDelete: (id: string) => void;
  onChangeRootEmoji?: (reviewId: string, type: EmojiType) => void;
  selectedLine?: number | null;
};

export function CommentSection({
  comments,
  onAddComment,
  onReply,
  onEdit,
  onDelete,
  onChangeRootEmoji,
}: Props) {
  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState<EmojiType>(EmojiType.QUESTION);

  const [isListOpen, setIsListOpen] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(true);

  const typeButtons = useMemo(
    () =>
      [
        EmojiType.QUESTION,
        EmojiType.IDEA,
        EmojiType.BUG,
        EmojiType.IMPORTANT,
        EmojiType.LOVE,
      ] as EmojiType[],
    []
  );

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    onAddComment(v, selectedType);
    setText('');
    setSelectedType(EmojiType.QUESTION);
  };

  return (
    <div className="p-4 bg-slate-50/50">
      <div className="sticky top-0 z-10 mb-3 space-y-3">
        <div className="flex items-center justify-between px-3 py-2 border shadow-sm rounded-xl bg-white/95 backdrop-blur">
          <div className="text-sm font-medium text-slate-700">
            댓글 <span className="text-slate-500">({comments.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsComposerOpen(v => !v)}
              className="h-8 px-2 text-slate-600"
              title={isComposerOpen ? '작성창 접기' : '작성창 펼치기'}
            >
              <Pencil className="w-4 h-4 mr-1" />
              {isComposerOpen ? '작성창 접기' : '작성창 펼치기'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsListOpen(v => !v)}
              className="h-8 px-2 text-slate-600"
              title={isListOpen ? '댓글 접기' : '댓글 펼치기'}
            >
              {isListOpen ? (
                <ChevronDown className="w-4 h-4 mr-1" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1" />
              )}
              {isListOpen ? '댓글 접기' : '댓글 펼치기'}
            </Button>
          </div>
        </div>

        {isComposerOpen && (
          <div className="p-3 bg-white border shadow-sm rounded-xl">
            <div className="flex gap-2 mb-2">
              {typeButtons.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={[
                    'px-2.5 py-1 rounded-full text-sm border transition',
                    selectedType === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700',
                  ].join(' ')}
                  title={EmojiTypeDetails[t].label}
                >
                  <span className="mr-1">{EmojiTypeDetails[t].emoji}</span>
                  {EmojiTypeDetails[t].label}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-3">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="min-h-[72px] resize-y border-blue-200 focus:border-blue-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    submit();
                  }
                }}
              />
              <Button className="px-5 bg-blue-600 h-11 hover:bg-blue-700" onClick={submit}>
                ✈️ 댓글 작성
              </Button>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Ctrl+Enter를 눌러 댓글을 작성하세요
            </div>
          </div>
        )}
      </div>

      {isListOpen && (
        <div className="space-y-3">
          {comments.map((c: any) => (
            <CommentThread
              key={c.id}
              comment={c}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onChangeEmoji={
                onChangeRootEmoji ? (t) => onChangeRootEmoji(c.id, t) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}