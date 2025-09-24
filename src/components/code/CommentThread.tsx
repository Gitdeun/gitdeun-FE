import { useState } from 'react';
import { MoreVertical, Reply, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { Textarea } from '../ui/textarea.tsx';
import { Avatar } from '../ui/avatar.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu.tsx';
import { Badge } from '../ui/badge.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../ui/alert-dialog.tsx';

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  replies?: Comment[];
  likes?: number;
  isLiked?: boolean;
  reportCount?: number;
  isEditing?: boolean;
  lineNumber?: number;
  avatarUrl?: string;
  isDeleted?: boolean;
  menuHidden?: boolean;
}

interface CommentThreadProps {
  comment: Comment;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  onDelete: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
  depth?: number;
}

export function CommentThread({
  comment,
  onReply,
  onEdit,
  onDelete,
  depth = 0
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(comment.id);
    setShowDeleteDialog(false);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const contentText = comment.isDeleted ? '사용자가 삭제한 댓글입니다.' : comment.content;

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 overflow-hidden ring-1 ring-blue-100">
          {comment.avatarUrl && !imgFailed ? (
            <img
              src={comment.avatarUrl}
              alt={`${comment.author || '사용자'}의 프로필 사진`}
              className="object-cover w-full h-full rounded-full"
              onError={() => setImgFailed(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-sm text-white bg-blue-500 rounded-full">
              {(comment.author?.[0] || 'U').toUpperCase()}
            </div>
          )}
        </Avatar>

        <div className="flex-1">
          <div className="p-3 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-900">{comment.author || '익명'}</span>
                <span className="text-xs text-gray-500">{formatTime(comment.timestamp)}</span>
                {comment.reportCount && comment.reportCount >= 5 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    신고됨
                  </Badge>
                )}
              </div>
              {!comment.menuHidden && !comment.isDeleted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="p-1 bg-white border rounded-md shadow-md"
                  >
                    <DropdownMenuItem
                      onClick={() => setIsEditing(true)}
                      className="group flex items-center gap-2 rounded-sm px-2 py-1.5 transition-colors
                                hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                    >
                      <Edit3 className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      수정
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="group flex items-center gap-2 rounded-sm px-2 py-1.5 transition-colors
                                hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] border-blue-200 focus:border-blue-400"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                    저장
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className={`whitespace-pre-wrap ${
                  comment.isDeleted ? 'text-gray-400 italic' : 'text-gray-800'
                }`}
              >
                {contentText}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
              className="h-6 px-2 text-gray-500"
              disabled={comment.isDeleted}
              title={comment.isDeleted ? '삭제된 댓글에는 답글을 달 수 없습니다.' : undefined}
            >
              <Reply className="w-4 h-4 mr-1" />
              답글
            </Button>
          </div>

          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="답글을 입력하세요..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] border-blue-200 focus:border-blue-400"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} className="bg-blue-600 hover:bg-blue-700">
                  답글 작성
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsReplying(false)}>
                  취소
                </Button>
              </div>
            </div>
          )}

          {comment.replies &&
            comment.replies.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}