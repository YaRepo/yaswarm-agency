import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-yaswarm-bg">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar
            mobile
            onNavigate={() => setMobileOpen(false)}
            className="relative z-10 h-full"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-3 md:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
