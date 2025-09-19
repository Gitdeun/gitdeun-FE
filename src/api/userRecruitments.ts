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

// 내 공고 목록 조회
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

// 내 신청 목록 조회
export async function getMyApplications(params: PagingParams = {}) {
  const res = await httpClient.get<Page<MyApplication>>(
    "/users/me/applications",
    { params, paramsSerializer: p => qs.stringify(p, { arrayFormat: "repeat" }) }
  );
  return res.data;
}

export type RecruitmentApplication = {
  applicationId: number;
  applicantName: string;
  applicantNickname: string;
  applicantProfileImage: string | null;
  recruitmentTitle: string;
  appliedField: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACCEPTED" | "CANCELLED" | string;
  createdAt: string; 
};

export async function getRecruitmentApplicants(
  recruitmentId: number | string,
  params: PagingParams = {}
) {
  const res = await httpClient.get<Page<RecruitmentApplication>>(
    `/recruitments/${recruitmentId}/applications`,
    { params, paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }) }
  );
  return res.data;
}

export type ApplicationDetailResponse = {
  applicationId: number;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  applicantNickname: string;
  applicantProfileImage: string | null;
  recruitmentId: number;
  recruitmentTitle: string;
  recruiterName: string;
  appliedField: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACCEPTED" | "CANCELLED" | string;
  rejectReason: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// 신청 살세 조회
export async function getApplicationById(applicationId: number | string) {
  const res = await httpClient.get<ApplicationDetailResponse>(`/applications/${applicationId}`);
  return res.data;
}

// 신청 철회(지원자)
export async function withdrawApplication(applicationId: number | string) {
  const res = await httpClient.patch(`/applications/${applicationId}/withdraw`);
  return res.data;
}

// 지원 수락(작성자)
export async function acceptApplication(applicationId: number | string) {
  const res = await httpClient.patch(`/applications/${applicationId}/accept`);
  return res.data;
}

// 지원 거절(작성자)
export async function rejectApplication(
  applicationId: number | string,
  rejectReason: string
) {
  const res = await httpClient.patch(
    `/applications/${applicationId}/reject`,
    { rejectReason }
  );
  return res.data;
}