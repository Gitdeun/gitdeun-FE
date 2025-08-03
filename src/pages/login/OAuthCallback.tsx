import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const fragment = window.location.hash;
    const token = fragment.split("=")[1]?.trim(); 

    window.location.hash = "";

    if (token) {
      localStorage.setItem("accessToken", token); 
      navigate("/login");
    } 
  }, []);

  return <div>로그인 처리 중...</div>;
}
