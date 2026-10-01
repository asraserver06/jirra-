"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Kanban,
  ListTodo,
  BarChart2,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);
  const { tickets } = useAppSelector((state) => state.tickets);

  const todoCount = tickets.filter((t) => t.status === 'todo').length;

  return (
    <aside
      className={`bg-[#0747A6] dark:bg-slate-900 text-white flex flex-col justify-between transition-all duration-200 ease-in-out relative z-30 select-none border-r border-blue-900/40 dark:border-slate-800 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div>
        {/* Project Branding Header */}
        <div className="p-3 border-b border-blue-800/60 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded bg-blue-500 flex items-center justify-center font-black text-white shrink-0 shadow-sm">
              <FolderGit2 className="w-4 h-4" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <h2 className="text-xs font-bold text-white tracking-wide truncate">Acme Software</h2>
                <p className="text-[10px] text-blue-200/80 dark:text-slate-400 truncate">Software Project (PROJ)</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          <div className="text-[10px] font-bold text-blue-300/80 dark:text-slate-400 uppercase px-2 py-1 tracking-wider">
            {!sidebarCollapsed ? 'Planning' : '•••'}
          </div>

          <Link
            href="/board"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition ${
              pathname === '/board'
                ? 'bg-blue-800/90 dark:bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-blue-100 dark:text-slate-300 hover:bg-blue-800/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Kanban className="w-4 h-4 shrink-0 text-blue-300 dark:text-blue-400" />
            {!sidebarCollapsed && <span>Kanban Board</span>}
          </Link>

          <Link
            href="/list"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition ${
              pathname === '/list'
                ? 'bg-blue-800/90 dark:bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-blue-100 dark:text-slate-300 hover:bg-blue-800/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <ListTodo className="w-4 h-4 shrink-0 text-amber-300 dark:text-amber-400" />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>All Issues</span>
                <span className="bg-blue-900 dark:bg-slate-700 text-blue-200 dark:text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                  {tickets.length}
                </span>
              </div>
            )}
          </Link>

          <Link
            href="/dashboard"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition ${
              pathname === '/dashboard'
                ? 'bg-blue-800/90 dark:bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-blue-100 dark:text-slate-300 hover:bg-blue-800/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <BarChart2 className="w-4 h-4 shrink-0 text-emerald-300 dark:text-emerald-400" />
            {!sidebarCollapsed && <span>Sprint Metrics</span>}
          </Link>
        </nav>
      </div>

      {/* Footer Info & Collapse Toggle */}
      <div className="p-3 border-t border-blue-800/60 dark:border-slate-800">
        {!sidebarCollapsed && (
          <div className="bg-blue-900/60 dark:bg-slate-800/80 p-2.5 rounded border border-blue-700/50 dark:border-slate-700 mb-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-blue-200 dark:text-slate-300 font-semibold mb-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Sprint 14
            </div>
            <div className="text-[10px] text-blue-200/80 dark:text-slate-400">
              {todoCount} items in backlog
            </div>
          </div>
        )}

        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full flex items-center justify-center p-1.5 bg-blue-800/70 dark:bg-slate-800 hover:bg-blue-700 dark:hover:bg-slate-700 rounded text-blue-200 transition"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
