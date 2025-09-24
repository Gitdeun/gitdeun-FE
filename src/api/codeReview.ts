import httpClient from "./httpClient";

export type EmojiType = 'QUESTION' | 'IDEA' | 'PRAISE' | 'NIT' | 'BUG' | 'INFO';

export type CreateCodeReviewRequest = {
  content: string;
  emojiType?: EmojiType;
  lineNumber?: number;
  filePath?: string;
};

export type ReviewStatus = 'PENDING' | 'RESOLVED' | string;
export type CodeReviewSummary = {
  reviewId: number;
  status: ReviewStatus;
  authorNickname: string;
  firstCommentContent: string;
  ccommentCount: number;           
  codeReferenceId?: number | null; 
  referenceId?: number | null;     
  createdAt: string;        
};

export type PageResponse<T> = {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  empty: boolean;
};

// 노드별 리뷰 목록 조회
export async function getMindmapNodeCodeReviews(
  mapId: number,
  nodeKey: string,
  params: { page?: number; size?: number } = {}
): Promise<PageResponse<CodeReviewSummary>> {
  const { page = 0, size = 10 } = params;
  const res = await httpClient.get(
    `/mindmaps/${mapId}/nodes/${encodeURIComponent(nodeKey)}/code-reviews`,
    { params: { page, size } }
  );
  return res.data as PageResponse<CodeReviewSummary>;
}

export type CodeReviewItem = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  emojiType?: EmojiType;
  lineNumber?: number;
  likes?: number;
  isLiked?: boolean;
  replies?: CodeReviewItem[];
  avatarUrl?: string;
};

// 리뷰 생성 (노드)
export async function postMindmapNodeCodeReview(
  mapId: number,
  nodeKey: string,
  req: CreateCodeReviewRequest,
  files?: File[]
): Promise<CodeReviewItem> {
  const payload = { ...req, emojiType: req.emojiType ?? 'QUESTION' };
  const form = new FormData();
  form.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'request.json');
  (files ?? []).forEach((f) => form.append('files', f, f.name));

  const res = await httpClient.post(
    `/mindmaps/${mapId}/nodes/${encodeURIComponent(nodeKey)}/code-reviews`,
    form,
    { transformRequest: (d) => d, headers: { 'Content-Type': undefined } }
  );
  return res.data as CodeReviewItem;
}

export type ReviewDetailComment = {
  commentId: number;
  content: string;
  authorNickname: string;
  authorProfileImage?: string;
  emojiType?: EmojiType;
  createdAt: string;
  updatedAt: string;
  replies: ReviewDetailComment[];
  attachments: unknown[];
  resolved: boolean;
};

export type ReviewDetail = {
  reviewId: number;
  status: string;
  authorNickname: string;
  authorProfileImage?: string;
  createdAt: string;
  updatedAt: string;
  comments: ReviewDetailComment[];
};

// 특정 리뷰 상세 조회 (스레드 조회)
export async function getReviewDetail(reviewId: number | string): Promise<ReviewDetail> {
  const res = await httpClient.get(`/code-reviews/${encodeURIComponent(String(reviewId))}`);
  return res.data as ReviewDetail;
}

export type CreatedComment = {
  commentId: number | string;
  authorNickname?: string;
  content: string;
  createdAt?: string;
};

// 댓글 작성
export async function postReviewComment(
  reviewId: number | string,
  req: CreateCodeReviewRequest,
  files?: File[]
): Promise<CreatedComment> {
  const payload = { ...req, emojiType: req.emojiType ?? 'QUESTION' };
  const form = new FormData();
  form.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'request.json');
  (files ?? []).forEach((f) => form.append('files', f, f.name));

  const res = await httpClient.post(
    `/code-reviews/${encodeURIComponent(String(reviewId))}/comments`,
    form,
    { transformRequest: (d) => d, headers: { 'Content-Type': undefined } }
  );
  return res.data as CreatedComment;
}

// 댓글 수정
export async function patchComment(commentId: number | string, body: { content: string }) {
  const res = await httpClient.patch(`/comments/${encodeURIComponent(String(commentId))}`, body);
  return res.data;
}

// 댓글 삭제
export async function deleteComment(commentId: number | string) {
  const res = await httpClient.delete(`/comments/${encodeURIComponent(String(commentId))}`);
  return res.data;
}

export type PatchReviewStatusBody = {
  status: 'RESOLVED' | 'OPEN';
};

// 리뷰 상태 변경 (생성 시 자동 해제)
export async function patchReviewStatus(
  reviewId: number | string,
  body: PatchReviewStatusBody = { status: 'RESOLVED' }
) {
  const res = await httpClient.patch(
    `/code-reviews/${encodeURIComponent(String(reviewId))}/status`,
    body
  );
  return res.data;
}

// 이모지 추가/변경/삭제
export async function patchCommentEmoji(
  commentId: number | string,
  body: { emojiType: string } 
) {
  const res = await httpClient.patch(
    `/comments/${encodeURIComponent(String(commentId))}/emoji`,
    body
  );
  return res.data;
}
