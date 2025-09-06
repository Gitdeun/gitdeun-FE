// src/types.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const EmojiType = {
  QUESTION: 'QUESTION',
  IDEA: 'IDEA',
  BUG: 'BUG',
  IMPORTANT: 'IMPORTANT',
  LOVE: 'LOVE'
} as const;

export type EmojiType = typeof EmojiType[keyof typeof EmojiType];

export const EmojiTypeDetails: Record<EmojiType, { emoji: string; label: string; className: string }> = {
  [EmojiType.QUESTION]:  { emoji: '❓', label: '질문',   className: 'bg-blue-100 text-blue-800' },
  [EmojiType.IDEA]:      { emoji: '💡', label: '아이디어', className: 'bg-yellow-100 text-yellow-800' },
  [EmojiType.BUG]:       { emoji: '🐞', label: '버그',   className: 'bg-red-100 text-red-800' },
  [EmojiType.IMPORTANT]: { emoji: '⭐️', label: '중요',   className: 'bg-purple-100 text-purple-800' },
  [EmojiType.LOVE]:      { emoji: '❤️', label: '칭찬',   className: 'bg-pink-100 text-pink-800' },
};

// --- 2. 인터페이스 정의 ---
export interface CodeComment {
  id: string;
  user: string;
  content: string;
  type: EmojiType;
}

export interface CodeLine {
  number: number;
  content: string;
  type?: 'added' | 'removed' | 'normal';
  comments?: CodeComment[];
  emojis?: { emoji: string; count: number; users: string[] }[];
}

export type EmojiCounts = Partial<Record<EmojiType, number>>;

export interface CodeViewerProps {
  file: {
    id: string;
    name: string;
    path: string;
    isDeleted?: boolean;
    content?: CodeLine[];
    branch?: string;
  } | null;
  onAddComment: (lineNumber: number, content: string, type: EmojiType) => void;
  onAddEmoji: (lineNumber: number, emoji: string) => void;
  onFileEmojiCountsChange?: (fileId: string, counts: EmojiCounts) => void;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
  isDeleted?: boolean;
  isExpanded?: boolean;
}

export interface FileListProps {
  files: FileItem[];
  selectedFile: string | null; // 선택된 파일 id
  onFileSelect: (item: FileItem) => void;
  onToggleFolder: (id: string) => void;
  /** ✅ 파일/폴더 옆에 표시할 이모지 합계 */
  emojiCountsByFileId?: Record<string, EmojiCounts>;
}

export interface FileListItemProps {
  item: FileItem;
  depth: number;
  isSelected: boolean;
  onFileSelect: (item: FileItem) => void;
  onToggleFolder: (id: string) => void;
  emojiCountsByFileId?: Record<string, EmojiCounts>;
}

export type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
  lineNumber?: number;
  replies?: Comment[];
  reportCount?: number;
};

export type mindmapComment = {
  id: string;
  nodeId: number;
  author: string;
  content: string;
  timestamp: string;
  reactions: Record<string, number>;
}

export type Mindmap = {
  id: number;
  link: string;
  title: string;
  updated: string;
  pinned?: boolean;
  eta?: string;
  type: '개발용' | '확인용';
};
