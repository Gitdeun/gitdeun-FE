import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const token = params.get("access_token") || hash.split("=")[1]?.trim();

    window.location.hash = "";

    if (token) {
      localStorage.setItem("accessToken", token);
      const redirect = localStorage.getItem('postLoginRedirect');
      if (redirect) {
        localStorage.removeItem('postLoginRedirect');
        navigate(redirect, { replace: true });
      } else {
        navigate("/mindmap", {
          state: { showTechStackModal: true },
          replace: true,
        });
      }
    }
  }, [navigate]);

  return <div>로그인 처리 중...</div>;
}
