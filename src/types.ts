// src/types.ts

// 파일 또는 폴더를 위한 단일 타입 정의
export type FileSystemItem = {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  isDeleted?: boolean;
  isExpanded?: boolean;
  children?: FileSystemItem[];
};

export interface FileItem {
  path: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
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
