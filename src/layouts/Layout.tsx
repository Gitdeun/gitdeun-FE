import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";

export default function Layout() {
  const { pathname } = useLocation();
  const showFooter =
    pathname === "/login" ||
    pathname === "/mindmap" ||
    pathname.startsWith("/mindmap/");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      {showFooter && (
        <footer className="py-2 text-sm text-center bg-gray-200">
          © 2025 동서남북
        </footer>
      )}
    </div>
  );
}
