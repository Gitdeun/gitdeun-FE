import { useState } from 'react';
import { MoreVertical, Reply, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar } from '../ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../ui/alert-dialog';
import { EmojiType, EmojiTypeDetails } from '../../types';

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
  emojiType?: EmojiType | null;
}

interface CommentThreadProps {
  comment: Comment;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  onDelete: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
  onChangeEmoji?: (type: EmojiType) => void;

  depth?: number;
}

export function CommentThread({
  comment,
  onReply,
  onEdit,
  onDelete,
  onChangeEmoji,
  depth = 0
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return '방금 전';
    if (m < 60) return `${m}분 전`;
    if (h < 24) return `${h}시간 전`;
    return `${d}일 전`;
  };

  const contentText = comment.isDeleted ? '사용자가 삭제한 댓글입니다.' : comment.content;

  const showEmojiChip = depth === 0 && !!comment.emojiType && !comment.isDeleted;
  const canChangeEmoji = depth === 0 && !!onChangeEmoji && !comment.isDeleted && !comment.menuHidden;

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

                {showEmojiChip && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${EmojiTypeDetails[comment.emojiType!].className}`}>
                    {EmojiTypeDetails[comment.emojiType!].emoji} {EmojiTypeDetails[comment.emojiType!].label}
                  </span>
                )}

                {comment.reportCount && comment.reportCount >= 5 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    신고됨
                  </Badge>
                )}
              </div>

              {canChangeEmoji && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="p-1 bg-white border rounded-md shadow-md">
                    <div className="px-2 py-1 text-[11px] text-gray-400">유형 변경</div>
                    {(Object.values(EmojiType) as EmojiType[]).map((t) => (
                      <DropdownMenuItem key={t} onClick={() => onChangeEmoji!(t)}>
                        {EmojiTypeDetails[t].emoji} {EmojiTypeDetails[t].label}
                      </DropdownMenuItem>
                    ))}
                    <div className="h-px my-1 bg-gray-100" />
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit3 className="w-4 h-4 mr-1" /> 수정
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="w-4 h-4 mr-1" /> 삭제
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
                  <Button size="sm" onClick={() => { if (editContent.trim()) onEdit(comment.id, editContent); setIsEditing(false); }} className="bg-blue-600 hover:bg-blue-700">
                    저장
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <p className={`whitespace-pre-wrap ${comment.isDeleted ? 'text-gray-400 italic' : 'text-gray-800'}`}>
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
                <Button size="sm" onClick={() => { if (replyContent.trim()) onReply(comment.id, replyContent); setReplyContent(''); setIsReplying(false); }} className="bg-blue-600 hover:bg-blue-700">
                  답글 작성
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsReplying(false)}>
                  취소
                </Button>
              </div>
            </div>
          )}

          {comment.replies?.map((reply) => (
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
            <AlertDialogDescription>이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onDelete(comment.id); setShowDeleteDialog(false); }} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
