// layouts/Layout.tsx
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-orange-600 text-white p-4 text-xl font-semibold">
        깃든
      </header>

      <main className="flex-1">
        <Outlet /> 
      </main>

      <footer className="bg-gray-200 text-center py-2 text-sm">
        © 2025 깃든
      </footer>
    </div>
  );
}
