import httpClient from "./httpClient";
import qs from "qs";

export type Recruitment = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  status: string;
  languageTags: string[];
  fieldTags: string[];
  startAt: string;
  endAt: string;
  viewCount: number;
  recruitQuota: number;
  matchScore: number | null;
};

export type Page<T> = {
  content: T[];
  pageable: { pageNumber: number; pageSize: number };
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
};

export type RecruitmentListParams = {
  status?: string;      // "RECRUITING"
  field?: string[];     // ["BACKEND","FRONTEND"] → field=A&field=B
  language?: string[];  // ["JAVA","TYPESCRIPT"] → language=A&language=B
  q?: string;           // 검색어
  page?: number;
  size?: number;
};

export async function getRecruitments(params: RecruitmentListParams) {
  const res = await httpClient.get<Page<Recruitment>>("/recruitments", {
    params,
    paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }),
  });
  return res.data;
}

export type RecruitmentDetail = {
  id: number;
  title: string;
  content: string;
  contactEmail: string | null;
  status: "FORTHCOMING" | "RECRUITING" | "CLOSED" | "COMPLETED" | string;
  startAt: string;
  endAt: string;
  teamSizeTotal: number;
  recruitQuota: number;
  viewCount: number;
  recruiterNickname: string;
  recruiterProfileImage: string | null;
  fieldTags: string[];      
  languageTags: string[];   
  images: null | Array<{ imageId: number; imageUrl: string }>;
};

export const getRecruitmentById = async (recruitmentId: number | string) => {
  const res = await httpClient.get<RecruitmentDetail>(`/recruitments/${recruitmentId}`);
  return res.data;
};

export type ApplyRequest = {
  appliedField: string;  
  message: string;    
};

export type ApplyResponse = unknown;

export const applyRecruitment = async (
  recruitmentId: number | string,
  body: ApplyRequest
): Promise<ApplyResponse> => {
  const res = await httpClient.post(`/recruitments/${recruitmentId}/applications`, body);
  return res.data;
};

export type RecommendationListParams = {
  page?: number;
  size?: number;
};

export async function getRecommendedRecruitments(params: RecommendationListParams = {}) {
  const res = await httpClient.get<Page<Recruitment>>(
    "/recruitments/recommendations",
    {
      params,
      paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }),
    }
  );
  return res.data;
}