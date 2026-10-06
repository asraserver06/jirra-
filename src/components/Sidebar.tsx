"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Kanban,
  ListTodo,
  BarChart2,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
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
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="bg-card/70 border-r border-border/60 flex flex-col justify-between relative z-30 select-none backdrop-blur-xs"
    >
      <div>
        {/* Project Branding Header */}
        <div className="p-3 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground shrink-0 shadow-2xs">
              <FolderGit2 className="w-4 h-4 text-primary" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <h2 className="text-xs font-bold text-foreground tracking-wide truncate">Acme Workspace</h2>
                <p className="text-[10px] text-muted-foreground truncate">Main Project (PROJ)</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 tracking-wider">
            {!sidebarCollapsed ? 'Planning' : '•••'}
          </div>

          <Link
            href="/board"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
              pathname === '/board'
                ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Kanban className="w-4 h-4 shrink-0 text-primary" />
            {!sidebarCollapsed && <span>Board</span>}
          </Link>

          <Link
            href="/list"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
              pathname === '/list'
                ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <ListTodo className="w-4 h-4 shrink-0 text-amber-500" />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>All Issues</span>
                <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  {tickets.length}
                </span>
              </div>
            )}
          </Link>

          <Link
            href="/dashboard"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
              pathname === '/dashboard'
                ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <BarChart2 className="w-4 h-4 shrink-0 text-emerald-500" />
            {!sidebarCollapsed && <span>Sprint Metrics</span>}
          </Link>
        </nav>
      </div>

      {/* Footer Info & Collapse Toggle */}
      <div className="p-3 border-t border-border/60 space-y-2">
        {!sidebarCollapsed && (
          <div className="bg-muted/50 p-3 rounded-xl border border-border/60 text-[11px]">
            <div className="flex items-center gap-1.5 text-foreground font-semibold mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Active Sprint
            </div>
            <div className="text-[10px] text-muted-foreground">
              {todoCount} tasks in backlog
            </div>
          </div>
        )}

        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full flex items-center justify-center p-2 bg-muted/60 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
};
