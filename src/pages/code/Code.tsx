import { useState, useMemo } from 'react';
import { useImmer } from 'use-immer';
import { FileList } from '../../components/code/FileList.tsx';
import { CodeViewer } from '../../components/code/CodeViewer.tsx';
import { CommentSection } from '../../components/code/CommentSection.tsx';
import type { Comment, FileItem, EmojiCounts } from '../../types.ts';

// Mock data
const mockFiles = [
  {
    id: '1', name: 'src', type: 'folder' as const, path: '/src', isExpanded: true, children: [
      { id: '2', name: 'components', type: 'folder' as const, path: '/src/components', isExpanded: true, children: [
          { id: '3', name: 'Header.tsx', type: 'file' as const, path: '/src/components/Header.tsx' },
          { id: '4', name: 'Footer.tsx', type: 'file' as const, path: '/src/components/Footer.tsx', isDeleted: true }
      ]},
      { id: '5', name: 'pages', type: 'folder' as const, path: '/src/pages', isExpanded: false, children: [
          { id: '6', name: 'Home.tsx', type: 'file' as const, path: '/src/pages/Home.tsx' },
          { id: '7', name: 'About.tsx', type: 'file' as const, path: '/src/pages/About.tsx' }
      ]},
      { id: '8', name: 'App.tsx', type: 'file' as const, path: '/src/App.tsx' }
    ]
  },
  { id: '9', name: 'package.json', type: 'file' as const, path: '/package.json' }
];

const mockCodeContent = [
  { number: 1, content: "import React from 'react';" },
  { number: 2, content: "import { Router } from 'react-router-dom';" },
  { number: 3, content: "" },
  { number: 4, content: "// 메인 헤더 컴포넌트" },
  { number: 5, content: "export function Header() {" },
  { number: 6, content: "  const [isMenuOpen, setIsMenuOpen] = useState(false);" },
  { number: 7, content: "" },
  { number: 8, content: "  return (" },
  { number: 9, content: "    <header className=\"bg-blue-600 text-white p-4\">" },
  { number: 10, content: "      <div className=\"container mx-auto flex justify-between items-center\">" },
  { number: 11, content: "        <h1 className=\"text-2xl font-bold\">깃든 프로젝트</h1>" },
  { number: 12, content: "        <nav className=\"hidden md:flex space-x-4\">" },
  { number: 13, content: "          <a href=\"/\" className=\"hover:text-blue-200\">홈</a>" },
  { number: 14, content: "          <a href=\"/about\" className=\"hover:text-blue-200\">소개</a>" },
  { number: 15, content: "        </nav>" },
  { number: 16, content: "      </div>" },
  { number: 17, content: "    </header>" },
  { number: 18, content: "  );" },
  { number: 19, content: "}" },
  { number: 20, content: "" }
];

const mockComments: Comment[] = [
  {
    id: 'c1', author: '김개발', content: '이 컴포넌트 구조가 깔끔하네요! 반응형 처리도 잘 되어 있고요.', timestamp: new Date(Date.now() - 3600000), likes: 3, isLiked: false, lineNumber: 9, replies: [
      { id: 'c2', author: '박프론트', content: '맞아요! Tailwind CSS 활용도 좋습니다.', timestamp: new Date(Date.now() - 1800000), likes: 1, isLiked: true }
    ]
  },
  { id: 'c3', author: '이백엔드', content: 'useState 사용법이 정확하네요. 메뉴 토글 기능도 구현해보면 좋을 것 같아요.', timestamp: new Date(Date.now() - 900000), likes: 2, isLiked: false, lineNumber: 6 }
];

const REPORT_THRESHOLD = 5;
const CURRENT_USER = '현재사용자';

// Helpers
const findItemById = (items: FileItem[], id: string): FileItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.type === 'folder' && item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
};
const findCommentById = (comments: Comment[], id: string): Comment | undefined => {
  for (const comment of comments) {
    if (comment.id === id) return comment;
    if (comment.replies) {
      const found = findCommentById(comment.replies, id);
      if (found) return found;
    }
  }
  return undefined;
};

export default function App() {
  const [files, setFiles] = useImmer(mockFiles);
  const [selectedFile, setSelectedFile] = useState<string | null>('3');
  const [comments, setComments] = useImmer<Comment[]>(mockComments);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // ✅ 파일별 이모지 합계(사이드바 상위 댓글 기준) 상태
  const [emojiCountsByFileId, setEmojiCountsByFileId] = useState<Record<string, EmojiCounts>>({});

  const currentFile = useMemo(() => {
    if (!selectedFile) return null;
    const fileData = findItemById(files, selectedFile);
    if (!fileData || fileData.type !== 'file') return null;

    return {
      ...fileData,
      content: fileData.id === '3'
        ? mockCodeContent.map(line => ({
            ...line,
            // 데모: 11번 라인에 전역(라인) 이모지 뱃지 예시
            emojis: line.number === 11 ? [{ emoji: '⭐', count: 2, users: ['김개발', '박프론트'] }] : undefined
          }))
        : undefined,
      branch: 'main'
    };
  }, [selectedFile, files]);

  const handleToggleFolder = (id: string) => {
    setFiles(draft => {
      const folder = findItemById(draft, id);
      if (folder && folder.type === 'folder') {
        folder.isExpanded = !folder.isExpanded;
      }
    });
  };

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      setSelectedFile(file.id);
      setSelectedLine(null);
    }
  };

  const handleAddComment = (content: string, lineNumber?: number) => {
    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: CURRENT_USER,
      content,
      timestamp: new Date(),
      likes: 0,
      isLiked: false,
      lineNumber
    };
    setComments(draft => {
      draft.push(newComment);
    });
  };

  const handleReply = (parentId: string, content: string) => {
    setComments(draft => {
      const parentComment = findCommentById(draft, parentId);
      if (parentComment) {
        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies.push({
          id: `r${Date.now()}`,
          author: CURRENT_USER,
          content,
          timestamp: new Date(),
          likes: 0,
          isLiked: false
        });
      }
    });
  };

  const handleEdit = (commentId: string, newContent: string) => {
    setComments(draft => {
      const comment = findCommentById(draft, commentId);
      if (comment) comment.content = newContent;
    });
  };

  const handleDelete = (commentId: string) => {
    const deleteComment = (list: Comment[]): Comment[] =>
      list.filter(c => {
        if (c.id === commentId) return false;
        if (c.replies) c.replies = deleteComment(c.replies);
        return true;
      });
    setComments(deleteComment);
  };

  const handleLike = (commentId: string) => {
    setComments(draft => {
      const c = findCommentById(draft, commentId);
      if (!c) return;
      const toggled = !c.isLiked;
      c.isLiked = toggled;
      c.likes = (c.likes || 0) + (toggled ? 1 : -1);
    });
  };

  const handleReport = (commentId: string) => {
    setComments(draft => {
      const c = findCommentById(draft, commentId);
      if (!c) return;
      c.reportCount = (c.reportCount || 0) + 1;
      if (c.reportCount >= REPORT_THRESHOLD) {
        console.log(`Comment ${commentId} has been reported ${REPORT_THRESHOLD}+ times and sent to admin`);
      }
    });
  };

  const handleAddEmoji = (lineNumber: number, emoji: string) => {
    console.log(`Added ${emoji} to line ${lineNumber}`);
  };

  const handleCodeLineComment = (lineNumber: number, content: string) => {
    if (content.trim()) {
      handleAddComment(content, lineNumber);
    } else {
      setSelectedLine(lineNumber);
    }
  };

  // ✅ CodeViewer에서 계산한 파일별 이모지 집계를 받아 파일 리스트에 전달
  const handleFileEmojiCountsChange = (fileId: string, counts: EmojiCounts) => {
    setEmojiCountsByFileId(prev => ({ ...prev, [fileId]: counts }));
  };

  return (
    <div className="h-screen flex flex-col bg-blue-50/20">
      <div className="flex-1 flex overflow-hidden">
        <FileList
          files={files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onToggleFolder={handleToggleFolder}
          /* ⬇️ 파일 옆 이모지 뱃지에 쓰임 */
          emojiCountsByFileId={emojiCountsByFileId}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex">
            <CodeViewer
              file={currentFile}
              onAddComment={handleCodeLineComment}
              onAddEmoji={handleAddEmoji}
              onFileEmojiCountsChange={handleFileEmojiCountsChange}
            />
          </div>
          <div className="h-80 overflow-y-auto">
            <CommentSection
              comments={comments}
              onAddComment={handleAddComment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLike={handleLike}
              onReport={handleReport}
              selectedLine={selectedLine}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
