import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true, 
});

// 사용자 정보 가져오기
export const getUserInfo = async (accessToken: string) => {
  const response = await API.get("/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
    },
  });
  return response.data; 
  
};

// 로그아웃
export const logoutUser = async () => {
  return API.post("/auth/logout");
};
