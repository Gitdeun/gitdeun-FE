import axios from "axios";
import Cookies from "js-cookie"; 

const BASE_URL = "http://localhost:8080/api";

const httpClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 요청 시 accessToken 자동 주입
httpClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken") || localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 응답 에러 처리 (선택)
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 처리 → 로그인 페이지로 리다이렉트 등
      console.warn("401 Unauthorized - 토큰 만료");
    }
    return Promise.reject(error);
  }
);

export default httpClient;
