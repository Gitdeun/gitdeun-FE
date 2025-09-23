import { useState, useEffect, useMemo, useCallback } from 'react';
import { useImmer } from 'use-immer';
import { useSearchParams, useLocation } from 'react-router-dom';

import { FileList } from '../../components/code/FileList.tsx';
import { CodeViewer } from '../../components/code/CodeViewer.tsx';
import { CommentSection } from '../../components/code/CommentSection.tsx';

import { getMindmapNodeCode } from '../../api/mindmap';
import { postMindmapNodeCodeReview } from '../../api/codeReview'; 

import type { Comment, FileItem, EmojiCounts } from '../../types.ts';

// ---------------- Helpers ----------------
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

// split path like "/src/components/Header.tsx" → ["src","components","Header.tsx"]
const splitPath = (p: string) => p.replace(/^\//, '').split('/').filter(Boolean);

// Ensure a path exists in tree; create missing folders/files; return the file id
function ensurePath(draft: FileItem[], fullPath: string): string | null {
  const segs = splitPath(fullPath);
  let cursorList: FileItem[] = draft;
  let currentPath = '';
  let node: FileItem | undefined;

  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    currentPath = '/' + (currentPath ? currentPath.replace(/^\//, '') + '/' : '') + seg;

    node = cursorList.find((it) => it.name === seg);

    if (!node) {
      if (i < segs.length - 1) {
        // create folder
        node = {
          id: currentPath,
          name: seg,
          type: 'folder',
          path: currentPath,
          isExpanded: true,
          children: []
        } as FileItem;
        cursorList.push(node);
      } else {
        // create file
        node = { id: currentPath, name: seg, type: 'file', path: currentPath } as FileItem;
        cursorList.push(node);
      }
    }

    if (node.type === 'folder') {
      node.isExpanded = true;
      cursorList = node.children ?? (node.children = []);
    } else if (i !== segs.length - 1) {
      // file appears before end of path → invalid path
      return null;
    }
  }

  return node && node.type === 'file' ? node.id : null;
}

// Convert a code string into an array of { number, content }
function toLineArray(code: string): Array<{ number: number; content: string }> {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  return lines.map((content, idx) => ({ number: idx + 1, content }));
}

// ---------------- Page ----------------
export default function CodePage() {
  // Read mapId/nodeKey from query or navigation state
  const [searchParams] = useSearchParams();
  const location = useLocation() as { state?: { mapId?: number; nodeKey?: string } };

  const mapIdParam = searchParams.get('mapId') ?? (location.state?.mapId?.toString() ?? null);
  const nodeKeyParam = searchParams.get('nodeKey') ?? (location.state?.nodeKey ?? null);

  const hasParams = !!(mapIdParam && nodeKeyParam);

  // Local UI states
  const [files, setFiles] = useImmer<FileItem[]>(hasParams ? [] : []); // 파라미터가 있으면 빈 트리로 시작
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [comments, setComments] = useImmer<Comment[]>([]); // ← mock 제거
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [emojiCountsByFileId, setEmojiCountsByFileId] = useState<Record<string, EmojiCounts>>({});

  // API-loaded code content per file id
  const [fileContentsById, setFileContentsById] = useState<Record<string, Array<{ number: number; content: string }>>>({});

  // Load node code by nodeKey → build/expand tree → store lines per file
  useEffect(() => {
    if (!mapIdParam || !nodeKeyParam) return;
    let cancelled = false;

    const run = async () => {
      try {
        const data = await getMindmapNodeCode(Number(mapIdParam), String(nodeKeyParam));
        const filesFromApi = Array.isArray(data?.files) ? data.files : [];
        if (filesFromApi.length === 0) return;

        // 트리를 싹 비우고 API 파일만 채움
        setFiles(() => []);

        const nextContents: Record<string, Array<{ number: number; content: string }>> = {};
        const openedIds: string[] = [];

        setFiles((draft) => {
          for (const f of filesFromApi) {
            const path = f.filePath || f.fileName;
            if (!path) continue;
            const fileId = ensurePath(draft as unknown as FileItem[], path);
            if (fileId) {
              openedIds.push(fileId);
              nextContents[fileId] = toLineArray(f.codeContents ?? '');
            }
          }
        });

        if (cancelled) return;
        setFileContentsById((prev) => ({ ...prev, ...nextContents }));

        if (openedIds[0]) {
          setSelectedFile(openedIds[0]);
          setSelectedLine(null);
        }
      } catch (e) {
        console.error(e);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [mapIdParam, nodeKeyParam, setFiles]);

  // Compute current file content (API-driven if present)
  const currentFile = useMemo(() => {
    if (!selectedFile) return null;
    const fileData = findItemById(files, selectedFile);
    if (!fileData || fileData.type !== 'file') return null;

    return {
      ...fileData,
      content: fileContentsById[fileData.id] /* API lines */ || undefined,
      branch: 'main'
    };
  }, [selectedFile, files, fileContentsById]);

  const handleToggleFolder = (id: string) => {
    setFiles((draft) => {
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

  // -------- 댓글 등록: API 호출 (파일 첨부 UI 추가 시 files 전달) --------
  const handleAddComment = async (content: string, lineNumber?: number) => {
    if (!content.trim()) return;
    if (!mapIdParam || !nodeKeyParam) return;

    try {
      const created = await postMindmapNodeCodeReview(
        Number(mapIdParam),
        String(nodeKeyParam),
        {
          content,
          emojiType: 'QUESTION' // TODO: UI에서 선택 가능하게 바꾸기
          // lineNumber 를 서버가 받는다면 여기에 추가:
          // lineNumber
        }
        // , files // ← File[] 첨부가 있다면 여기 전달
      );

      // 서버 응답을 화면 Comment 타입으로 매핑
      const newComment: Comment = {
        id: created.id ?? `c${Date.now()}`,
        author: created.author ?? 'me',
        content: created.content,
        timestamp: new Date(created.createdAt ?? Date.now()),
        likes: created.likes ?? 0,
        isLiked: created.isLiked ?? false,
        lineNumber
      };

      setComments((draft) => {
        draft.unshift(newComment);
      });
    } catch (e) {
      console.error(e);
      // TODO: toast로 에러 노출
    }
  };

  // (대댓글은 이후 /replies API 붙일 때 확장)
  const handleReply = (_parentId: string, _content: string) => {
    // TODO: post .../code-reviews/{reviewId}/replies 연결 예정
  };

  const handleEdit = (commentId: string, newContent: string) => {
    setComments((draft) => {
      const c = draft.find((x) => x.id === commentId);
      if (c) c.content = newContent;
    });
  };

  const handleDelete = (commentId: string) => {
    const deleteComment = (list: Comment[]): Comment[] =>
      list.filter((c) => {
        if (c.id === commentId) return false;
        if (c.replies) c.replies = deleteComment(c.replies);
        return true;
      });
    setComments(deleteComment);
  };

  const handleLike = (commentId: string) => {
    setComments((draft) => {
      const c = draft.find((x) => x.id === commentId);
      if (!c) return;
      const toggled = !c.isLiked;
      c.isLiked = toggled;
      c.likes = (c.likes || 0) + (toggled ? 1 : -1);
    });
  };

  const handleReport = (_commentId: string) => {
    // TODO: 필요 시 신고 API 연결
  };

  const handleAddEmoji = (_lineNumber: number, _emoji: string) => {
    // TODO: 파일/라인 이모지 시스템 붙일 때 구현
  };

  const handleCodeLineComment = (lineNumber: number, content: string) => {
    if (content.trim()) {
      void handleAddComment(content, lineNumber);
    } else {
      setSelectedLine(lineNumber);
    }
  };

  const handleFileEmojiCountsChange = useCallback((fileId: string, counts: EmojiCounts) => {
    setEmojiCountsByFileId((prev) => ({ ...prev, [fileId]: counts }));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-blue-50/20">
      <div className="flex flex-1 overflow-hidden">
        <FileList
          files={files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onToggleFolder={handleToggleFolder}
          emojiCountsByFileId={emojiCountsByFileId}
        />
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-1 min-h-0">
            <CodeViewer
              file={currentFile}
              onAddComment={handleCodeLineComment}
              onAddEmoji={handleAddEmoji}
              onFileEmojiCountsChange={handleFileEmojiCountsChange}
            />
          </div>
          <div className="overflow-y-auto h-80">
            <CommentSection
              comments={comments}
              onAddComment={(content) => void handleAddComment(content)}
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
