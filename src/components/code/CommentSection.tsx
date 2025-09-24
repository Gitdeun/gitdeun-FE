import { useEffect, useState } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { Textarea } from '../ui/textarea.tsx';
import { CommentThread } from './CommentThread.tsx';
import type { Comment } from './CommentThread.tsx';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string, lineNumber?: number) => void;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onReport: (commentId: string) => void;
  selectedLine?: number | null;

  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
}

export function CommentSection({
  comments,
  onAddComment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onReport,
  selectedLine,
  collapsed,
  onCollapsedChange,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = collapsed ?? internalCollapsed;

  useEffect(() => {
    if (collapsed !== undefined) setInternalCollapsed(collapsed);
  }, [collapsed]);

  const toggle = () => {
    if (onCollapsedChange) onCollapsedChange(!isCollapsed);
    else setInternalCollapsed((v) => !v);
  };

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment, selectedLine || undefined);
      setNewComment('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full border-t border-blue-200 bg-blue-50/30">
      <div className="flex items-center justify-between p-4 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-blue-900">
            댓글 {comments.length > 0 && `(${comments.length})`}
          </h3>
          {selectedLine && (
            <span className="px-2 py-1 text-sm text-blue-600 bg-blue-100 rounded">
              라인 {selectedLine}
            </span>
          )}
          {isCollapsed && <span className="ml-2 text-xs text-gray-500">접힘</span>}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggle}
          className="text-xs"
          aria-label={isCollapsed ? '댓글 펼치기' : '댓글 접기'}
          title={isCollapsed ? '댓글 펼치기' : '댓글 접기'}
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              펼치기
            </>
          ) : (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              접기
            </>
          )}
        </Button>
      </div>
      {!isCollapsed && (
        <div className="flex-1 p-4 pt-0 overflow-y-auto">
          <div className="mb-6 space-y-3">
            <Textarea
              placeholder={
                selectedLine
                  ? `라인 ${selectedLine}에 대한 댓글을 입력하세요...`
                  : '댓글을 입력하세요...'
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] border-blue-200 focus:border-blue-400 bg-white"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Ctrl+Enter를 눌러 댓글을 작성하세요
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                댓글 작성
              </Button>
            </div>
          </div>
          {comments.length > 0 ? (
            <div className="space-y-1">
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  onReport={onReport}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-300" />
              <p>아직 댓글이 없습니다.</p>
              <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}