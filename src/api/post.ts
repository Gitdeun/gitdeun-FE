import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true,
});

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

export const createRecruitment = async (
  requestDto: RecruitmentRequest,
  images: File[]
) => {
  const formData = new FormData();
  formData.append(
    "requestDto",
    new Blob([JSON.stringify(requestDto)], { type: "application/json" })
  );

  images.forEach((file) => {
    formData.append("images", file);
  });

  const accessToken = localStorage.getItem("accessToken");

  const response = await API.post("/recruitments", formData, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  return response.data;
};
