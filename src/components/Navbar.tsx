"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Grid,
  Search,
  Bell,
  HelpCircle,
  Plus,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { setSearchQuery, setCreateModalOpen } from '@/store/slices/uiSlice';
import { ThemeToggle } from './ui/theme-toggle';
import { Button } from './ui/button';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { searchQuery } = useAppSelector((state) => state.ui);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleSignOut = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <header className="bg-[#0747A6] dark:bg-slate-900 text-white h-12 border-b border-blue-900/60 dark:border-slate-800 px-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Left: App Switcher + Jira Logo + Links */}
      <div className="flex items-center gap-3">
        <button className="p-1 hover:bg-blue-800 dark:hover:bg-slate-800 rounded text-blue-100 transition">
          <Grid className="w-4 h-4" />
        </button>

        <Link href="/board" className="flex items-center gap-2 select-none group">
          <div className="w-6 h-6 bg-white text-[#0747A6] rounded font-black flex items-center justify-center text-xs shadow-xs group-hover:scale-105 transition">
            J
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">Jira Software</span>
        </Link>

        {/* Header Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-blue-100 dark:text-slate-300 ml-2">
          <Link href="/board" className="px-2.5 py-1 hover:bg-blue-800/80 dark:hover:bg-slate-800 rounded transition">
            Board
          </Link>
          <Link href="/list" className="px-2.5 py-1 hover:bg-blue-800/80 dark:hover:bg-slate-800 rounded transition">
            List
          </Link>
          <Link href="/dashboard" className="px-2.5 py-1 hover:bg-blue-800/80 dark:hover:bg-slate-800 rounded transition">
            Dashboard
          </Link>
        </nav>

        {/* Global Create Button */}
        <Button
          onClick={() => dispatch(setCreateModalOpen(true))}
          variant="jira"
          size="sm"
          className="h-7 text-xs font-bold gap-1 ml-2 bg-[#0052CC] hover:bg-blue-600 dark:bg-blue-600"
        >
          <Plus className="w-3.5 h-3.5" /> Create
        </Button>
      </div>

      {/* Middle: Search Box */}
      <div className="hidden sm:flex items-center relative max-w-xs w-full mx-4">
        <Search className="w-3.5 h-3.5 text-blue-300 dark:text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search Jira issues..."
          className="w-full bg-blue-900/60 dark:bg-slate-800 text-white placeholder-blue-300/70 dark:placeholder-slate-400 text-xs rounded-md pl-8 pr-3 py-1 border border-blue-800 dark:border-slate-700 focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition"
        />
      </div>

      {/* Right Controls: Theme Toggle, Notifications, User Profile */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button className="p-1.5 hover:bg-blue-800 dark:hover:bg-slate-800 rounded text-blue-200 transition">
          <Bell className="w-4 h-4" />
        </button>

        <button className="p-1.5 hover:bg-blue-800 dark:hover:bg-slate-800 rounded text-blue-200 transition hidden md:block">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-1.5 p-1 hover:bg-blue-800/80 dark:hover:bg-slate-800 rounded-full transition"
          >
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-400/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center">
                {user?.name?.substring(0, 2) || 'JM'}
              </div>
            )}
            <ChevronDown className="w-3 h-3 text-blue-200" />
          </button>

          {showUserDropdown && (
            <div
              className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl py-2 z-50 text-foreground animate-in fade-in-50 zoom-in-95"
              onClick={() => setShowUserDropdown(false)}
            >
              <div className="px-3 py-2 border-b border-border">
                <div className="font-semibold text-xs truncate">{user?.name || 'Guest User'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user?.email || 'guest@jira.local'}</div>
                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  <ShieldCheck className="w-3 h-3" />
                  {user?.role || 'Member'}
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/board"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition"
                >
                  <Grid className="w-3.5 h-3.5 text-muted-foreground" /> Kanban Board
                </Link>
                <Link
                  href="/list"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition"
                >
                  <UserIcon className="w-3.5 h-3.5 text-muted-foreground" /> All Issues
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" /> Sprint Metrics
                </Link>
              </div>

              <div className="border-t border-border pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
