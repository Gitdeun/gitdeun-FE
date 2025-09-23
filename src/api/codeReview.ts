// api/codeReview.ts
import httpClient from "./httpClient";

export type EmojiType = 'QUESTION' | 'IDEA' | 'PRAISE' | 'NIT' | 'BUG' | 'INFO';

export type CreateCodeReviewRequest = {
  content: string;
  emojiType?: EmojiType;         // ← 옵셔널로 받고, 기본값은 아래에서 채움
  lineNumber?: number;
  filePath?: string;
};

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
};

export async function postMindmapNodeCodeReview(
  mapId: number,
  nodeKey: string,
  req: CreateCodeReviewRequest,
  files?: File[]
): Promise<CodeReviewItem> {
  // 이모지 선택 안 하면 기본 QUESTION
  const payload: Required<Pick<CreateCodeReviewRequest, 'content' | 'emojiType'>> & Partial<CreateCodeReviewRequest> = {
    emojiType: req.emojiType ?? 'QUESTION',
    content: req.content,
    lineNumber: req.lineNumber,
    filePath: req.filePath,
  };

  const form = new FormData();
  // 📌 Spring @RequestPart("request")가 application/json을 기대하므로 Blob으로 넣기
  form.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'request.json');

  (files ?? []).forEach(f => form.append('files', f, f.name));

  // ❗ 여기서 절대 Content-Type을 수동 문자열로 지정하지 마세요( boundary 깨짐 )
  // 또한 전역 transform이 있으면 우회해야 함
  const res = await httpClient.post(
    `/mindmaps/${mapId}/nodes/${encodeURIComponent(nodeKey)}/code-reviews`,
    form,
    {
      transformRequest: (d) => d,          // 변환 금지
      headers: { 'Content-Type': undefined } // 전역 application/json 덮어쓰기
    }
  );
  return res.data as CodeReviewItem;
}
