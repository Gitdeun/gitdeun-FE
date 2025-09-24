import httpClient from "./httpClient";

export type CreateCodeReferenceRequest = {
  filePath: string;   
  startLine: number;  
  endLine: number;    
};

export type CodeReferenceCreated = {
  codeReferenceId?: number;
  referenceId?: number;
  filePath: string;
  startLine: number;
  endLine: number;
  createdAt?: string;
};

// 코드 참조(파일/라인 구간)생성
export async function postCodeReference(
  mapId: number,
  nodeKey: string,
  body: CreateCodeReferenceRequest
): Promise<CodeReferenceCreated> {
  const res = await httpClient.post(
    `/mindmaps/${mapId}/nodes/${encodeURIComponent(nodeKey)}/code-references`,
    body
  );
  return res.data as CodeReferenceCreated;
}

// 코드 참조 삭제
export async function deleteCodeReference(
  mapId: number,
  refId: number | string
) {
  await httpClient.delete(
    `/mindmaps/${mapId}/code-references/${encodeURIComponent(String(refId))}`
  );
}

export type CreateReferenceReviewRequest = {
  content: string;
  emojiType?: 'QUESTION' | 'IDEA' | 'PRAISE' | 'NIT' | 'BUG' | 'INFO' | 'IMPORTANT' | 'LOVE';
};

// 리뷰 생성(노드)
export async function postReferenceCodeReview(
  refId: number | string,
  req: CreateReferenceReviewRequest,
  files?: File[]
) {
  const payload = { ...req, emojiType: req.emojiType ?? 'QUESTION' };
  const form = new FormData();
  form.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'request.json');
  (files ?? []).forEach((f) => form.append('files', f, f.name));

  const res = await httpClient.post(
    `/references/${encodeURIComponent(String(refId))}/code-reviews`,
    form,
    { transformRequest: (d) => d, headers: { 'Content-Type': undefined } }
  );
  return res.data;
}

export type CodeReferenceSummary = {
  referenceId: number;
  filePath: string;
  startLine: number;
  endLine: number;
  createdAt?: string;
};

// 노드별 코드 참조 목록 조회
export async function listCodeReferences(
  mapId: number,
  nodeKey: string
): Promise<CodeReferenceSummary[]> {
  const res = await httpClient.get(
    `/mindmaps/${mapId}/nodes/${encodeURIComponent(nodeKey)}/code-references`
  );
  return (res.data?.content ?? res.data) as CodeReferenceSummary[];
}

export type ReferenceReviewSummary = {
  reviewId: number;
  emojiType?: 'QUESTION' | 'IDEA' | 'BUG' | 'IMPORTANT' | 'LOVE';
  commentsCount?: number;
  createdAt?: string;
  resolved?: boolean;
};

// 특정 리뷰 상세 조회 (스레드 조회)
export async function getReferenceReviews(
  refId: number | string
): Promise<ReferenceReviewSummary[]> {
  const res = await httpClient.get(
    `/code-reviews/${encodeURIComponent(String(refId))}`
  );
  return (res.data?.content ?? res.data) as ReferenceReviewSummary[];
}

export type CodeReferenceDetail = {
  referenceId: number;
  nodeKey: string;
  filePath: string;
  startLine: number;
  endLine: number;
  codeContent?: string;
  reviewIds: number[];
};

// 코드 참조 상세 조회
export async function getReferenceDetail(
  mapId: number,
  refId: number | string
): Promise<CodeReferenceDetail> {
  const res = await httpClient.get(
    `/mindmaps/${mapId}/code-references/${encodeURIComponent(String(refId))}/detail`
  );
  return res.data as CodeReferenceDetail;
}