// httpClient.ts
import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = "http://localhost:8080/api";

const httpClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  // ⛔ 전역 Content-Type 고정하지 말기
  // headers: { "Content-Type": "application/json" },
});

// 토큰 주입
httpClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken") || localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ FormData면 Content-Type 제거 + transform 우회
    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isFormData) {
      if (config.headers) {
        // axios가 boundary 넣도록 비워둔다
        delete (config.headers as any)["Content-Type"];
      }
      // 전역 transform이 있다면 우회
      (config as any).transformRequest = [(d: any) => d];
    } else {
      // JSON 요청에는 명시적으로 설정(선택)
      if (config.headers) {
        (config.headers as any)["Content-Type"] = "application/json";
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 에러 처리 (옵션)
httpClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("401 Unauthorized - 토큰 만료");
    }
    return Promise.reject(err);
  }
);

export default httpClient;
