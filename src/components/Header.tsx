import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; 
import logo from "../assets/images/ic_logo.svg";
import LoginModal from "./modal/LoginModal";
import { getUserInfo, logoutUser } from "../api/auth";
import { Bell } from 'lucide-react';
import NotificationConsent from "../components/notifications/NotificationConsent";
import NotificationsDrawer from "../components/notifications/NotificationsDrawer";
import { getUnreadCount } from "../api/notification";   

interface User {
  nickname: string;
  profileImage: string;
}

export default function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [unread, setUnread] = useState<number>(0);       
  const { pathname } = useLocation();

  const baseNav =
    "text-lg font-semibold relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-sky-500 after:transition-all after:duration-300";
  const inactive = "text-sky-800 hover:text-sky-500 after:w-0 hover:after:w-full";
  const active = "text-sky-500 after:w-full";

  const isMindmap = pathname.startsWith("/mindmap");
  const isPosts   = pathname.startsWith("/posts") || pathname.startsWith("/post");
  const isMypage  = pathname.startsWith("/mypage");

  // 읽지 않은 알림 개수 갱신 함수
  const refreshUnread = async () => {
    try {
      const token = localStorage.getItem("accessToken")?.trim();
      if (!token) {
        setUnread(0);
        return;
      }
      const { unreadCount } = await getUnreadCount(); 
      setUnread(typeof unreadCount === "number" ? unreadCount : 0);
    } catch {
      setUnread(0);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken")?.trim();
    if (!token) {
      setUser(null);
      setUnread(0);
      return;
    }
    getUserInfo()
      .then((data) => {
        setUser({ nickname: data.nickname, profileImage: data.profileImage });
        refreshUnread();
      })
      .catch((err) => {
        console.warn("❗ 사용자 정보를 불러오지 못했습니다:", err);
        setUser(null);
        setUnread(0);
      });
  }, []);

  useEffect(() => {
    if (!notifOpen) refreshUnread();
  }, [notifOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error("서버 로그아웃 실패", e);
    }
    localStorage.removeItem("accessToken");
    setUser(null);
    setUnread(0);
    window.location.href = "/login";
  };

  const handleBellClick = () => {
    const v = localStorage.getItem("notification-consent");
    if (v === "Yes") {
      setNotifOpen(true);   
    } else {
      setConsentOpen(true);
    }
  };

  return (
    <>
      <NotificationConsent
        storageKey="notification-consent"
        visible={consentOpen}
        onClose={() => setConsentOpen(false)}
        onAllow={() => {
          setConsentOpen(false);
          setNotifOpen(true);
        }}
        onBlock={() => setConsentOpen(false)}
      />
      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        
      <header className="w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto w-full max-w-[min(1400px,98vw)] px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src={logo} alt="Gitdeun logo" className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-xl sm:text-2xl font-bold text-sky-900">깃든</span>
            </div>

            <nav className="flex items-center gap-5 sm:gap-7 truncate">
              <Link
                to="/mindmap"
                className={`${baseNav} ${isMindmap ? active : inactive}`}
                aria-current={isMindmap ? "page" : undefined}
                onClick={(e) => {
                  const token = localStorage.getItem("accessToken")?.trim();
                  if (!token) { e.preventDefault(); setShowModal(true); }
                }}
              >
                마인드맵
              </Link>

              <Link
                to="/posts"
                className={`${baseNav} ${isPosts ? active : inactive}`}
                aria-current={isPosts ? "page" : undefined}
                onClick={(e) => {
                  const token = localStorage.getItem("accessToken")?.trim();
                  if (!token) { e.preventDefault(); setShowModal(true); }
                }}
              >
                팀원 모집
              </Link>

              <Link
                to="/mypage"
                className={`${baseNav} ${isMypage ? active : inactive}`}
                aria-current={isMypage ? "page" : undefined}
                onClick={(e) => {
                  const token = localStorage.getItem("accessToken")?.trim();
                  if (!token) { e.preventDefault(); setShowModal(true); }
                }}
              >
                마이페이지
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div>
              <button
                type="button"
                aria-label="Open notifications"
                onClick={handleBellClick}
                className="relative p-2 text-gray-700 rounded-full hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 ? (
                  <span
                    className="absolute -right-1 -top-1 inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] text-white"
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </button>
            </div>

            {!user ? (
              <button
                onClick={() => setShowModal(true)}
                className="bg-sky-500 text-white px-5 py-2.5 rounded-full text-sm sm:text-base font-bold hover:scale-[1.02] transition-transform duration-150"
              >
                로그인
              </button>
            ) : (
              <div className="flex items-center gap-3 sm:gap-4">
                <img 
                  src={user.profileImage} 
                  alt="프로필 이미지" 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                />
                <span className="text-sm sm:text-base font-bold truncate max-w-[20ch]">{user.nickname}님</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-5 py-2.5 rounded-full text-sm sm:text-base font-bold hover:scale-[1.02] transition-transform duration-150"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>

          {showModal && <LoginModal onClose={() => setShowModal(false)} />}
        </div>
      </header>
    </>
  );
}
