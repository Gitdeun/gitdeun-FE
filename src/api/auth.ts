import httpClient from "./httpClient";

// 사용자 정보 가져오기
export const getUserInfo = async () => {
  const res = await httpClient.get("/users/me");
  return res.data;
};

// 로그아웃
export const logoutUser = async () => {
  return httpClient.post("/auth/logout");
};
