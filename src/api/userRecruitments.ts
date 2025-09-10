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

export type PagingParams = {
  page?: number;
  size?: number;
};

export async function getMyRecruitments(params: PagingParams = {}) {
  const res = await httpClient.get<Page<Recruitment>>(
    "/users/me/recruitments",
    { params, paramsSerializer: p => qs.stringify(p, { arrayFormat: "repeat" }) }
  );
  return res.data;
}

export type MyApplication = {
  applicationId: number;
  applicantName: string;
  applicantNickname: string;
  applicantProfileImage: string | null;
  recruitmentTitle: string;
  appliedField: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | string;
  createdAt: string;   
};

export async function getMyApplications(params: PagingParams = {}) {
  const res = await httpClient.get<Page<MyApplication>>(
    "/users/me/applications",
    { params, paramsSerializer: p => qs.stringify(p, { arrayFormat: "repeat" }) }
  );
  return res.data;
}
