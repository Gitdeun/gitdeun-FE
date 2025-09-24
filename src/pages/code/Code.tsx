import { useState, useEffect, useMemo, useCallback } from 'react';
import { useImmer } from 'use-immer';
import { useSearchParams, useLocation } from 'react-router-dom';

import { FileList } from '../../components/code/FileList.tsx';
import { CodeViewer } from '../../components/code/CodeViewer.tsx';
import { CommentSection } from '../../components/code/CommentSection.tsx';

import { getMindmapNodeCode } from '../../api/mindmap';
import {
  getMindmapNodeCodeReviews,
  postMindmapNodeCodeReview,
  getReviewDetail,
  postReviewComment,
  patchComment as patchCommentApi,
  deleteComment as deleteCommentApi,
  patchReviewStatus,
  type CodeReviewSummary,
  type ReviewDetailComment,
  patchCommentEmoji
} from '../../api/codeReview';

import {
  postCodeReference,
  postReferenceCodeReview,
  listCodeReferences,
  deleteCodeReference,
  getReferenceDetail,
  type CodeReferenceDetail,
} from '../../api/codeReference';

import type { Comment } from '../../components/code/CommentThread.tsx';
import type {
  FileItem,
  EmojiCounts,
  CodeLine,
  EmojiType as UiEmojiType,
  CodeComment,
} from '../../types.ts';
import { EmojiType as EmojiTypeConst } from '../../types.ts';

type RefMarker = {
  referenceId: number;
  filePath: string;
  startLine: number;
  endLine: number;
  emojiType?: UiEmojiType;
  count: number;
};

type CodeCommentWithStatus = CodeComment & { 
  status?: 'OPEN' | 'RESOLVED' 
  rootCommentId?: string;
};

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

const findFirstFileId = (items: FileItem[]): string | null => {
  const queue: FileItem[] = [...items];
  while (queue.length) {
    const n = queue.shift()!;
    if (n.type === 'file') return n.id;
    if (n.type === 'folder' && n.children?.length) {
      queue.unshift(...n.children);
    }
  }
  return null;
};

const splitPath = (p: string) => p.replace(/^\//, '').split('/').filter(Boolean);

const toSidebarComment = (c: any): CodeComment => ({
  id: String(c.commentId),
  user: c.authorNickname ?? 'unknown',
  content: c.content ?? '',
  type: fromApiEmoji(c.emojiType) ?? EmojiTypeConst.QUESTION,
  replies: (c.replies ?? []).map(toSidebarComment),
});

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
        node = { id: currentPath, name: seg, type: 'folder', path: currentPath, isExpanded: true, children: [] } as FileItem;
        cursorList.push(node);
      } else {
        node = { id: currentPath, name: seg, type: 'file', path: currentPath } as FileItem;
        cursorList.push(node);
      }
    }
    if (node.type === 'folder') {
      node.isExpanded = true;
      cursorList = node.children ?? (node.children = []);
    } else if (i !== segs.length - 1) {
      return null;
    }
  }
  return node && node.type === 'file' ? node.id : null;
}

function toLineArray(code: string): CodeLine[] {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  return lines.map((content, idx) => ({ number: idx + 1, content }));
}

function getRootReviewId(targetId: string, threads: Comment[]): string | null {
  for (const top of threads) {
    if (top.id === targetId) return top.id;
    const stack = [...(top.replies ?? [])];
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur.id === targetId) return top.id;
      if (cur.replies) stack.push(...cur.replies);
    }
  }
  return null;
}

function mapReviewCommentTree(c: ReviewDetailComment): Comment {
  return {
    id: String(c.commentId),
    author: c.authorNickname ?? 'unknown',
    content: c.content ?? '',
    timestamp: new Date(c.createdAt ?? Date.now()),
    avatarUrl: (c as any).authorProfileImage ?? undefined,
    replies: (c.replies ?? []).map(mapReviewCommentTree),
    likes: 0,
    isLiked: false,
  };
}

const toApiEmoji = (t: UiEmojiType): string => {
  switch (t) {
    case EmojiTypeConst.QUESTION:  return 'QUESTION';
    case EmojiTypeConst.IDEA:      return 'IDEA';
    case EmojiTypeConst.BUG:       return 'BUG';
    case EmojiTypeConst.IMPORTANT: return 'IMPORTANT';
    case EmojiTypeConst.LOVE:      return 'LOVE';
    default:                       return 'QUESTION';
  }
};

const fromApiEmoji = (s?: string): UiEmojiType | undefined => {
  switch (s) {
    case 'QUESTION':  return EmojiTypeConst.QUESTION;
    case 'IDEA':      return EmojiTypeConst.IDEA;
    case 'BUG':       return EmojiTypeConst.BUG;
    case 'IMPORTANT': return EmojiTypeConst.IMPORTANT;
    case 'LOVE':      return EmojiTypeConst.LOVE;
    default:          return undefined;
  }
};

export default function CodePage() {
  const [searchParams] = useSearchParams();
  const location = useLocation() as { state?: { mapId?: number; nodeKey?: string } };

  const mapIdParam = searchParams.get('mapId') ?? (location.state?.mapId?.toString() ?? null);
  const nodeKeyParam = searchParams.get('nodeKey') ?? (location.state?.nodeKey ?? null);

  const [files, setFiles] = useImmer<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [comments, setComments] = useImmer<Comment[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [emojiCountsByFileId, setEmojiCountsByFileId] = useState<Record<string, EmojiCounts>>({});
  const [fileContentsById, setFileContentsById] = useState<Record<string, CodeLine[]>>({});
  const mindmapUrl = mapIdParam ? `/mindmap/${mapIdParam}` : '/mindmap';

  const [currentRef, setCurrentRef] = useState<{
    refId: number;
    filePath: string;
    startLine: number;
    endLine: number;
  } | null>(null);

  const [refMarkersByFileId, setRefMarkersByFileId] = useState<Record<string, RefMarker[]>>({});
  const [refThreadsByRefId, setRefThreadsByRefId] = useState<Record<number, CodeCommentWithStatus[]>>({});

  useEffect(() => {
    if (!mapIdParam || !nodeKeyParam) return;
    let cancelled = false;
    const run = async () => {
      try {
        const data = await getMindmapNodeCode(Number(mapIdParam), String(nodeKeyParam));
        const filesFromApi = Array.isArray(data?.files) ? data.files : [];
        if (filesFromApi.length === 0) return;

        setFiles(() => []);
        const nextContents: Record<string, CodeLine[]> = {};
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
      } catch (e) {
        console.error(e);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [mapIdParam, nodeKeyParam]);

  useEffect(() => {
    if (selectedFile || files.length === 0) return;
    const firstId = findFirstFileId(files);
    if (firstId) {
      setSelectedFile(firstId);
      setSelectedLine(null);
    }
  }, [files, selectedFile]);

  const loadReviews = useCallback(async () => {
    if (!mapIdParam || !nodeKeyParam) return;
    const page = await getMindmapNodeCodeReviews(Number(mapIdParam), String(nodeKeyParam), { page: 0, size: 20 });

    const baseThreads: Comment[] = (page.content as CodeReviewSummary[]).map((r) => ({
      id: String(r.reviewId),
      author: r.authorNickname ?? 'unknown',
      content: r.firstCommentContent ?? '',
      timestamp: new Date(r.createdAt ?? Date.now()),
      likes: 0,
      isLiked: false,
      replies: [],
      avatarUrl: (r as any).authorProfileImage ?? undefined,
    }));
    setComments(baseThreads);

    await Promise.all(
      baseThreads.map(async (t) => {
        try {
          const detail = await getReviewDetail(Number(t.id));
          const children = (detail.comments ?? []).map(mapReviewCommentTree);
          setComments((draft) => {
            const node = draft.find((x) => x.id === t.id);
            if (!node) return;
            node.avatarUrl = (detail as any).authorProfileImage ?? node.avatarUrl;
            node.replies = children.filter((c) => !(c.content === node.content && c.author === node.author));
          });
        } catch (e) {
          console.error(e);
        }
      })
    );
  }, [mapIdParam, nodeKeyParam, setComments]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

  const findFileIdByPath = useCallback((path: string): string | null => {
    const normPath = path.replace(/\\/g, '/');
    const norm = normPath.startsWith('/') ? normPath : `/${normPath}`;

    const stack: FileItem[] = [...files];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.type === 'file' && (n.path === norm || n.id === norm)) return n.id;
      if (n.type === 'folder' && n.children) stack.push(...n.children);
    }
    return null;
  }, [files]);

  const listReviewIdsOfRef = useCallback(async (refId: number): Promise<number[]> => {
    if (!mapIdParam || !nodeKeyParam) return [];
    const page = await getMindmapNodeCodeReviews(
      Number(mapIdParam),
      String(nodeKeyParam),
      { page: 0, size: 200 }
    );
    const all = (page.content ?? page) as CodeReviewSummary[];
    return (all as any[])
      .filter(r => (r as any).codeReferenceId === refId || (r as any).referenceId === refId)
      .map(r => Number((r as any).reviewId));
  }, [mapIdParam, nodeKeyParam]);

  const loadReferenceMarkers = useCallback(async () => {
    if (!mapIdParam || !nodeKeyParam) return;
    try {
      const refs = await listCodeReferences(Number(mapIdParam), String(nodeKeyParam));
      const page = await getMindmapNodeCodeReviews(
        Number(mapIdParam),
        String(nodeKeyParam),
        { page: 0, size: 200 }
      );
      const all = (page.content ?? page) as CodeReviewSummary[];

      const byRef = new Map<number, any[]>();
      (all as any[]).forEach(r => {
        const rid = r.codeReferenceId ?? r.referenceId;
        if (rid == null) return;
        const arr = byRef.get(rid) ?? [];
        arr.push(r);
        byRef.set(rid, arr);
      });

      const byFile: Record<string, RefMarker[]> = {};

      await Promise.all(
        refs.map(async (r: any) => {
          const fileId = findFileIdByPath(r.filePath);
          if (!fileId) return;

          const related = byRef.get(r.referenceId) ?? [];
          const count = related.reduce((acc, it: any) => acc + (it.commentCount ?? 0), 0);

          let emoji: UiEmojiType | undefined;
          if (related[0]) {
            try {
              const d = await getReviewDetail(Number(related[0].reviewId));
              const first = d?.comments?.[0];
              emoji = fromApiEmoji(first?.emojiType as any);
            } catch {}
          }

          const list = byFile[fileId] ?? (byFile[fileId] = []);
          list.push({
            referenceId: r.referenceId,
            filePath: r.filePath,
            startLine: r.startLine,
            endLine: r.endLine,
            count,
            emojiType: emoji,
          });
        })
      );

      setRefMarkersByFileId(byFile);
    } catch (e) {
      console.error(e);
    }
  }, [mapIdParam, nodeKeyParam, findFileIdByPath]);

  const loadReferenceThreads = useCallback(async (refId: number) => {
    try {
      if (!mapIdParam) return;

      let detail: CodeReferenceDetail | null = null;
      try {
        detail = await getReferenceDetail(Number(mapIdParam), refId);
      } catch {}

      const reviewIds: number[] =
        detail?.reviewIds?.length ? detail.reviewIds : await listReviewIdsOfRef(refId);

      const threads: CodeCommentWithStatus[] = [];
      for (const reviewId of reviewIds) {
        const d = await getReviewDetail(Number(reviewId));
        const first = d?.comments?.[0];
        if (!first) continue;

        const childrenSource =
          Array.isArray(first.replies) && (first.replies?.length ?? 0) > 0
            ? first.replies
            : (d.comments ?? []).slice(1);

        threads.push({
          id: String(reviewId),                  
          rootCommentId: String(first.commentId),
          user: first.authorNickname ?? 'unknown',
          content: first.content ?? '',
          type: fromApiEmoji(first.emojiType) ?? EmojiTypeConst.QUESTION,
          replies: childrenSource.map(toSidebarComment),
          status: ((d as any).status ?? ((d as any).resolved ? 'RESOLVED' : 'OPEN')) as any,
        });
      }

      setRefThreadsByRefId(prev => ({ ...prev, [refId]: threads }));
    } catch (e) {
      console.error(e);
    }
  }, [mapIdParam, listReviewIdsOfRef]);

  useEffect(() => {
    if (currentRef?.refId) void loadReferenceThreads(currentRef.refId);
  }, [currentRef?.refId, loadReferenceThreads]);

  const currentFile = useMemo(() => {
    if (!selectedFile) return null;
    const fileData = findItemById(files, selectedFile);
    if (!fileData || fileData.type !== 'file') return null;
    return {
      ...fileData,
      content: fileContentsById[fileData.id] || undefined,
      branch: 'main',
    };
  }, [selectedFile, files, fileContentsById]);

  const handleToggleFolder = (id: string) => {
    setFiles((draft) => {
      const folder = findItemById(draft, id);
      if (folder && folder.type === 'folder') folder.isExpanded = !folder.isExpanded;
    });
  };
  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      setSelectedFile(file.id);
      setSelectedLine(null);
    }
  };

  const handleAddComment = async (
    content: string,
    lineNumber?: number,
    type: UiEmojiType = EmojiTypeConst.QUESTION
  ) => {
    if (!content.trim() || !mapIdParam || !nodeKeyParam) return;
    await postMindmapNodeCodeReview(
      Number(mapIdParam),
      String(nodeKeyParam),
      { content, emojiType: toApiEmoji(type) as any, lineNumber }
    );
    await loadReviews();
  };

  const refreshThread = useCallback(async (reviewId: string) => {
    try {
      const detail = await getReviewDetail(Number(reviewId));
      const children = (detail.comments ?? []).map(mapReviewCommentTree);
      setComments((draft) => {
        const node = draft.find((x) => x.id === reviewId);
        if (!node) return;
        node.avatarUrl = (detail as any).authorProfileImage ?? node.avatarUrl;
        node.replies = children.filter((c) => !(c.content === node.content && c.author === node.author));
      });
    } catch (e) {
      console.error(e);
    }
  }, [setComments]);

  const handleReply = async (parentId: string, content: string) => {
    if (!content.trim()) return;
    const reviewId = getRootReviewId(parentId, comments);
    if (!reviewId) return;
    await postReviewComment(Number(reviewId), {
      content,
      emojiType: toApiEmoji(EmojiTypeConst.QUESTION) as any,
    });
    await refreshThread(reviewId);
  };

  const handleAddRefReply = useCallback(async (reviewId: string, content: string) => {
    const txt = content.trim();
    if (!txt) return;
    await postReviewComment(Number(reviewId), {
      content: txt,
      emojiType: toApiEmoji(EmojiTypeConst.QUESTION) as any,
    });
    if (currentRef?.refId) {
      await loadReferenceThreads(currentRef.refId); 
    }
  }, [currentRef?.refId, loadReferenceThreads]);

  const handleEdit = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;
    const reviewId = getRootReviewId(commentId, comments);
    if (!reviewId) return;
    await patchCommentApi(commentId, { content: newContent });
    await refreshThread(reviewId);
  };
  const handleDelete = async (commentId: string) => {
    const reviewId = getRootReviewId(commentId, comments);
    if (!reviewId) return;
    await deleteCommentApi(commentId);
    await refreshThread(reviewId);
  };

  const handleCreateCodeReference = useCallback(async (payload: {
    filePath: string;
    startLine: number;
    endLine: number;
  }) => {
    if (!mapIdParam || !nodeKeyParam) return;
    try {
      const created = await postCodeReference(Number(mapIdParam), String(nodeKeyParam), payload);
      const refId = (created.codeReferenceId ?? (created as any).referenceId) as number;
      if (refId) {
        setCurrentRef({ refId, filePath: payload.filePath, startLine: payload.startLine, endLine: payload.endLine });
        await loadReferenceMarkers();
        await loadReferenceThreads(refId);
      }
    } catch (e) {
      console.error(e);
    }
  }, [mapIdParam, nodeKeyParam, loadReferenceMarkers, loadReferenceThreads]);

  const handleAddRefReview = useCallback(async (content: string, type: UiEmojiType = EmojiTypeConst.QUESTION, _files?: File[]) => {
    if (!currentRef || !content.trim()) return;
    try {
      const created: any = await postReferenceCodeReview(
        currentRef.refId,
        { content, emojiType: toApiEmoji(type) as any },
        _files
      );

      await loadReferenceMarkers();

      const newReviewId = Number(created?.reviewId);
      if (newReviewId) {
        const detail = await getReviewDetail(newReviewId);
        const first = detail?.comments?.[0];
        if (first) {
          const childrenSource =
            Array.isArray(first.replies) && (first.replies?.length ?? 0) > 0
              ? first.replies
              : (detail.comments ?? []).slice(1);

          const newThread: CodeCommentWithStatus = {
            id: String(newReviewId),
            rootCommentId: String(first.commentId), 
            user: first.authorNickname ?? 'unknown',
            content: first.content ?? '',
            type: fromApiEmoji(first.emojiType) ?? EmojiTypeConst.QUESTION,
            replies: childrenSource.map(toSidebarComment),
            status: (((detail as any).status ?? ((detail as any).resolved ? 'RESOLVED' : 'OPEN')) as any),
          };

          setRefThreadsByRefId(prev => {
            const cur = prev[currentRef.refId] ?? [];
            return { ...prev, [currentRef.refId]: [newThread, ...cur] };
          });
        }
      } else {
        await loadReferenceThreads(currentRef.refId);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentRef, loadReferenceMarkers, loadReferenceThreads]);

  const handleResolveReview = useCallback(async (reviewId: string) => {
    try {
      await patchReviewStatus(Number(reviewId), { status: 'RESOLVED' });
      if (currentRef?.refId) {
        setRefThreadsByRefId(prev => {
          const list = prev[currentRef.refId] ?? [];
          return {
            ...prev,
            [currentRef.refId]: list.map(t =>
              t.id === reviewId ? ({ ...t, status: 'RESOLVED' }) : t
            ),
          };
        });
      }
    } catch (e) {
      console.error(e);
      alert('댓글 닫기에 실패했어요.');
    }
  }, [currentRef?.refId]);

  const handleCodeLineComment = (lineNumber: number, content: string, type: UiEmojiType) => {
    if (content.trim()) void handleAddComment(content, lineNumber, type);
    else setSelectedLine(lineNumber);
  };

  const handleFileEmojiCountsChange = useCallback((fileId: string, counts: EmojiCounts) => {
    setEmojiCountsByFileId((prev) => ({ ...prev, [fileId]: counts }));
  }, []);

  const currentMarkers = selectedFile ? (refMarkersByFileId[selectedFile] ?? []) : [];
  const referenceThreads = currentRef?.refId ? (refThreadsByRefId[currentRef.refId] ?? []) : [];

  useEffect(() => {
    if (!mapIdParam || !nodeKeyParam) return;
    if (files.length === 0) return;
    void loadReferenceMarkers();
  }, [files, mapIdParam, nodeKeyParam, loadReferenceMarkers]);

  const handleDeleteReference = useCallback(async (refId: number) => {
    if (!mapIdParam) return;
    try {
      await deleteCodeReference(Number(mapIdParam), refId);

      setRefMarkersByFileId(prev => {
        const next: typeof prev = {};
        for (const [fileId, list] of Object.entries(prev)) {
          next[fileId] = list.filter(m => m.referenceId !== refId);
        }
        return next;
      });
      setRefThreadsByRefId(prev => {
        const { [refId]: _removed, ...rest } = prev;
        return rest;
      });
      if (currentRef?.refId === refId) setCurrentRef(null);

      await loadReferenceMarkers();
    } catch (e) {
      console.error(e);
      alert('참조 삭제에 실패했어요.');
    }
  }, [mapIdParam, currentRef?.refId, setRefMarkersByFileId, setRefThreadsByRefId, loadReferenceMarkers]);

  const handleChangeRefEmoji = useCallback(
    async (reviewId: string, commentId: string, uiType: UiEmojiType) => {
      try {
        await patchCommentEmoji(commentId, { emojiType: toApiEmoji(uiType) as any });

        if (currentRef?.refId) {
          setRefThreadsByRefId(prev => {
            const list = prev[currentRef.refId] ?? [];
            return {
              ...prev,
              [currentRef.refId]: list.map(t =>
                t.id === reviewId ? { ...t, type: uiType } : t
              ),
            };
          });
        }
      } catch (e) {
        console.error(e);
        alert('유형 변경에 실패했어요.');
      }
    },
    [currentRef?.refId, setRefThreadsByRefId]
  );

  return (
    <div className="flex flex-col h-screen bg-blue-50/20">
      <div className="flex flex-1 overflow-hidden">
        <FileList
          files={files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onToggleFolder={handleToggleFolder}
          emojiCountsByFileId={emojiCountsByFileId}
          mindmapUrl={mindmapUrl}
        />
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-1 min-h-0">
            <CodeViewer
              file={currentFile}
              onAddComment={(line, content, type) => handleCodeLineComment(line, content, type)}
              onAddEmoji={() => {}}
              onFileEmojiCountsChange={handleFileEmojiCountsChange}
              onCreateCodeReference={handleCreateCodeReference}
              currentReferenceId={currentRef?.refId ?? null}
              onAddRefReview={(content, type, files) => handleAddRefReview(content, type, files)}
              onSidebarClose={() => setCurrentRef(null)}
              referenceMarkers={currentMarkers}
              onSelectReference={(m) => setCurrentRef({
                refId: m.referenceId, filePath: m.filePath, startLine: m.startLine, endLine: m.endLine
              })}
              referenceThreads={referenceThreads}
              onDeleteReference={handleDeleteReference}
              onResolveReview={(rid) => void handleResolveReview(rid)}
              onReplyRefReview={(reviewId, text) => void handleAddRefReply(reviewId, text)}
              onChangeRefEmoji={(reviewId, commentId, type) =>
                handleChangeRefEmoji(reviewId, commentId, type)
              }
            />
          </div>

          <div className="overflow-y-auto transition-all duration-200 ease-in-out max-h-80">
            <CommentSection
              comments={comments}
              onAddComment={(content) => void handleAddComment(content)}
              onReply={(pid, c) => void handleReply(pid, c)}
              onEdit={(id, txt) => void handleEdit(id, txt)}
              onDelete={(id) => void handleDelete(id)}
              onLike={() => {}}
              onReport={() => {}}
              selectedLine={selectedLine}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
