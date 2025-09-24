import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = "http://localhost:8080/api";

const httpClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

httpClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken") || localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }


    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isFormData) {
      if (config.headers) {
        delete (config.headers as any)["Content-Type"];
      }
      (config as any).transformRequest = [(d: any) => d];
    } else {
      if (config.headers) {
        (config.headers as any)["Content-Type"] = "application/json";
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

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
