import httpClient from "./httpClient";

export type RecruitmentRequest = {
  title: string;
  content: string;
  contactEmail: string;
  startAt: string | null;
  endAt: string | null;
  teamSizeTotal: number;
  recruitQuota: number;
  fieldTags: string[];
  languageTags: string[];
};

// 모집 공고 작성
export const createRecruitment = async (
  requestDto: RecruitmentRequest,
  images: File[]
) => {
  const formData = new FormData();
  formData.append(
    "requestDto",
    new Blob([JSON.stringify(requestDto)], { type: "application/json" })
  );
  images.forEach((file) => formData.append("images", file));

  const res = await httpClient.post("/recruitments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
