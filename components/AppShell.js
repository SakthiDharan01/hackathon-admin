"use client";

import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ title, children, actions }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} actions={actions} />
        {children}
      </div>
    </div>
  );
}
