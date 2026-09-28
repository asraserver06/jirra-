import React, { useState } from 'react';
import {
  Kanban,
  ListTodo,
  BarChart2,
  Settings,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
} from 'lucide-react';
import { useSession } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useSession();

  return (
    <aside
      className={`bg-[#0747A6] text-white flex flex-col justify-between transition-all duration-200 ease-in-out relative z-30 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Project Banner & Branding */}
      <div>
        <div className="p-4 border-b border-blue-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-black text-white shrink-0 shadow-md">
              <FolderGit2 className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h2 className="text-xs font-bold text-white tracking-wide truncate">Acme Software</h2>
                <p className="text-[10px] text-blue-200 truncate">Software Project (PROJ)</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className="p-2 space-y-1">
          <button
            onClick={() => onTabChange('kanban')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'kanban'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'text-blue-100 hover:bg-blue-800/50'
            }`}
          >
            <Kanban className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Kanban Board</span>}
          </button>

          <button
            onClick={() => onTabChange('backlog')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'backlog'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'text-blue-100 hover:bg-blue-800/50'
            }`}
          >
            <ListTodo className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Backlog</span>
                <span className="bg-blue-900/80 text-blue-200 text-[10px] px-1.5 py-0.5 rounded font-mono">14</span>
              </div>
            )}
          </button>

          <button
            onClick={() => onTabChange('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'reports'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'text-blue-100 hover:bg-blue-800/50'
            }`}
          >
            <BarChart2 className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Reports & Insights</span>}
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'text-blue-100 hover:bg-blue-800/50'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Project Settings</span>}
          </button>
        </nav>
      </div>

      {/* Footer Signout */}
      <div className="p-3 border-t border-blue-800/60 flex items-center justify-between gap-1">
        {!collapsed ? (
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-xs font-semibold text-blue-200 hover:text-white hover:bg-blue-800/60 px-2 py-1.5 rounded-md transition w-full"
          >
            <LogOut className="w-4 h-4 text-red-300" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="p-1.5 hover:bg-blue-800 rounded-lg text-red-300 hover:text-red-200 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-blue-800 rounded-lg text-blue-200 hover:text-white transition ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
