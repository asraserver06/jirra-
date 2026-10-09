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
  Users,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { switchWorkspace } from '@/store/slices/workspaceSlice';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);
  const { tickets } = useAppSelector((state) => state.tickets);
  const { current: workspace, myRole, workspaces } = useAppSelector((state) => state.workspace);

  const todoCount = tickets.filter((t) => t.status === 'todo').length;
  const isAdmin = myRole === 'admin';

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
                <h2 className="text-xs font-bold text-foreground tracking-wide truncate">
                  {workspace?.name || 'Workspace'}
                </h2>
                <p className="text-[10px] text-muted-foreground truncate capitalize">
                  {myRole || 'member'}
                </p>
              </div>
            )}
          </div>
        </div>
        {!sidebarCollapsed && workspaces.length > 1 && (
          <div className="px-3 py-2 border-b border-border/60">
            <label htmlFor="workspace-switcher" className="sr-only">Switch workspace</label>
            <select
              id="workspace-switcher"
              value={workspace?._id || ''}
              onChange={(event) => dispatch(switchWorkspace(event.target.value))}
              className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground"
            >
              {workspaces.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>
        )}

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
            {!sidebarCollapsed && <span>Workspace Metrics</span>}
          </Link>

          {/* Members & Invites — visible to everyone, but invite action is admin-only in the page */}
          <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 tracking-wider mt-3">
            {!sidebarCollapsed ? 'Workspace' : '•'}
          </div>

          <Link
            href="/members"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
              pathname === '/members'
                ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 text-violet-500" />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Members</span>
                {isAdmin && (
                  <span className="bg-violet-500/15 text-violet-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    Admin
                  </span>
                )}
              </div>
            )}
          </Link>
        </nav>
      </div>

      {/* Footer Info & Collapse Toggle */}
      <div className="p-3 border-t border-border/60 space-y-2">
        {!sidebarCollapsed && (
          <div className="bg-muted/50 p-3 rounded-xl border border-border/60 text-[11px]">
            <div className="text-foreground font-semibold mb-0.5">
              To do
            </div>
            <div className="text-[10px] text-muted-foreground">
              {todoCount} {todoCount === 1 ? 'issue' : 'issues'}
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
