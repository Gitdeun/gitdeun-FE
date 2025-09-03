"use client";

import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import type { mindmapComment } from "../../types";
import { Star, Heart, MessageCircle, Flag, Trash2, History } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface CodeViewerProps {
  fileName: string;
  code: string;
  isDeleted?: boolean;
  deletedAt?: string;
  comments: mindmapComment[]; // 💡 'Comment' 타입을 'mindmapComment'로 변경
  onAddComment: (content: string) => void;
  onReaction: (commentId: string, emoji: string) => void;
  onDeleteComment: (commentId: string) => void;
  onReportComment: (commentId: string) => void;
}

export function CodeViewer({
  fileName,
  code,
  isDeleted,
  deletedAt,
  comments,
  onAddComment,
  onReaction,
  onDeleteComment,
  onReportComment,
}: CodeViewerProps) {
  const [newComment, setNewComment] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment("");
    }
  };

  const formatCode = (code: string) => {
    return code.split('\n').map((line, index) => (
      <div key={index} className="flex">
        <span className="w-12 text-muted-foreground text-right pr-4 select-none">
          {index + 1}
        </span>
        <span className="flex-1">{line}</span>
      </div>
    ));
  };

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="truncate">{fileName}</h3>
          {isDeleted && (
            <Badge variant="destructive" className="ml-2">
              <Trash2 className="w-3 h-3 mr-1" />
              삭제됨
            </Badge>
          )}
        </div>

        {isDeleted && deletedAt && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              삭제일: {new Date(deletedAt).toLocaleDateString()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-1" />
              히스토리
            </Button>
          </div>
        )}
      </div>

      {/* Code content */}
      <ScrollArea className="flex-1 p-4">
        <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm">
          {formatCode(code)}
        </div>
      </ScrollArea>

      {/* Comments section */}
      <div className="border-t border-border">
        <div className="p-4">
          <h4 className="mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            댓글 ({comments.length})
          </h4>

          {/* Add comment */}
          <div className="space-y-2 mb-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="min-h-20"
            />
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              댓글 추가
            </Button>
          </div>

          {/* Comments list */}
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">{comment.content}</p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReaction(comment.id, '⭐')}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {comment.reactions['⭐'] || 0}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReaction(comment.id, '❤️')}
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      {comment.reactions['❤️'] || 0}
                    </Button>
                    
                    <div className="flex-1" />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteComment(comment.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReportComment(comment.id)}
                    >
                      <Flag className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}