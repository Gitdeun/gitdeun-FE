// layouts/Layout.tsx
import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Outlet /> 
      </main>

      <footer className="bg-gray-200 text-center py-2 text-sm">
        © 2025 동서남북
      </footer>
    </div>
  );
}
