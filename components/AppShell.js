"use client";

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ title, children, actions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = () => setSidebarOpen(false);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar title={title} actions={actions} onMenu={() => setSidebarOpen(true)} />
        {children}
      </div>
    </div>
  );
}
