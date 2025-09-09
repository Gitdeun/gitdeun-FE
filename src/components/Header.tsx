import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; 
import logo from "../assets/images/ic_logo.svg";
import LoginModal from "./modal/LoginModal";
import { getUserInfo, logoutUser } from "../api/auth";

interface User {
  nickname: string;
  profileImage: string;
}

export default function Header() {
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { pathname } = useLocation();

  const baseNav =
    "text-lg font-semibold relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-sky-500 after:transition-all after:duration-300";
  const inactive = "text-sky-800 hover:text-sky-500 after:w-0 hover:after:w-full";
  const active = "text-sky-500 after:w-full";

  const isMindmap = pathname.startsWith("/mindmap");
  const isPosts = pathname.startsWith("/posts") || pathname.startsWith("/post");
  const isMypage = pathname.startsWith("/mypage");

  useEffect(() => {
    const token = localStorage.getItem("accessToken")?.trim();
    if (!token) {
      setUser(null);
      return;
    }
    getUserInfo()
      .then((data) => {
        setUser({ nickname: data.nickname, profileImage: data.profileImage });
      })
      .catch((err) => {
        console.warn("❗ 사용자 정보를 불러오지 못했습니다:", err);
        setUser(null);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error("서버 로그아웃 실패", e);
    }
    localStorage.removeItem("accessToken");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="w-full flex justify-between items-center px-[60px] py-[30px]">
      <div className="flex items-center space-x-1">
        <img src={logo} alt="Gitdeun logo" className="w-8 h-8" />
        <span className="text-2xl font-bold text-sky-900">깃든</span>

        <nav className="flex items-center space-x-8 ml-[70px]">
          <Link
            to="/mindmap"
            className={`${baseNav} ${isMindmap ? active : inactive}`}
            aria-current={isMindmap ? "page" : undefined}
          >
            마인드맵
          </Link>

          <Link
            to="/posts"
            className={`${baseNav} ${isPosts ? active : inactive}`}
            aria-current={isPosts ? "page" : undefined}
          >
            팀원 모집
          </Link>

          <Link
            to="/mypage"
            className={`${baseNav} ${isMypage ? active : inactive}`}
            aria-current={isMypage ? "page" : undefined}
          >
            마이페이지
          </Link>
        </nav>
      </div>

      {!user ? (
        <button
          onClick={() => setShowModal(true)}
          className="bg-sky-300 text-white px-[24px] py-[12px] rounded-full text-lg font-bold hover:scale-105 transition-transform duration-200 ease-in-out"
        >
          로그인
        </button>
      ) : (
        <div className="flex items-center space-x-4">
          <img 
            src={user.profileImage} 
            alt="프로필 이미지" 
            className="w-10 h-10 rounded-full"
          />
          <span className="text-lg font-bold">{user.nickname}님</span>
          <button
            onClick={handleLogout}
            className="bg-red-400 text-white px-[24px] py-[12px] rounded-full text-lg font-bold hover:scale-105 transition-transform duration-200 ease-in-out"
          >
            로그아웃
          </button>
        </div>
      )}

      {showModal && <LoginModal onClose={() => setShowModal(false)} />}
    </header>
  );
}
