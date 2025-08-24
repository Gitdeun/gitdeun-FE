import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { Textarea } from '../ui/textarea.tsx';
import  { CommentThread } from './CommentThread.tsx';
import type {Comment} from './CommentThread.tsx'

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string, lineNumber?: number) => void;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onReport: (commentId: string) => void;
  selectedLine?: number | null;
}

export function CommentSection({
  comments,
  onAddComment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onReport,
  selectedLine
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');

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
    <div className="border-t border-blue-200 bg-blue-50/30">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-blue-900">
            댓글 {comments.length > 0 && `(${comments.length})`}
          </h3>
          {selectedLine && (
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
              라인 {selectedLine}
            </span>
          )}
        </div>

        {/* New Comment Input */}
        <div className="space-y-3 mb-6">
          <Textarea
            placeholder={selectedLine ? `라인 ${selectedLine}에 대한 댓글을 입력하세요...` : "댓글을 입력하세요..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] border-blue-200 focus:border-blue-400 bg-white"
          />
          <div className="flex justify-between items-center">
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

        {/* Comments List */}
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
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-300" />
            <p>아직 댓글이 없습니다.</p>
            <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}