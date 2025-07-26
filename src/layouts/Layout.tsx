import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div>
      <header>GitVisualMind Header</header>
      <main>
        <Outlet />
      </main>
      <footer>© 2025 GitVisualMind</footer>
    </div>
  );
}
