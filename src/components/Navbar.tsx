"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Search,
  Bell,
  Plus,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  Kanban,
  Sparkles,
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
  const { myRole } = useAppSelector((state) => state.workspace);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleSignOut = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <header className="glass-header h-14 border-b border-border/60 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Brand Logo & Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/board" className="flex items-center gap-2.5 select-none group">
          <div className="w-8 h-8 bg-foreground text-background rounded-xl font-extrabold flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition-transform duration-200">
            T
          </div>
          <span className="font-bold text-base tracking-tight text-foreground hidden sm:inline-block">
            TaskFlow
          </span>
        </Link>

        {/* Header Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium ml-2">
          <Link
            href="/board"
            className="px-3 py-1.5 hover:bg-muted text-foreground/80 hover:text-foreground rounded-lg transition-colors"
          >
            Board
          </Link>
          <Link
            href="/list"
            className="px-3 py-1.5 hover:bg-muted text-foreground/80 hover:text-foreground rounded-lg transition-colors"
          >
            List
          </Link>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 hover:bg-muted text-foreground/80 hover:text-foreground rounded-lg transition-colors"
          >
            Metrics
          </Link>
          <Link
            href="/members"
            className="px-3 py-1.5 hover:bg-muted text-foreground/80 hover:text-foreground rounded-lg transition-colors"
          >
            Members
          </Link>
        </nav>

        {/* Global Create Button */}
        <Button
          onClick={() => dispatch(setCreateModalOpen(true))}
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 ml-2 shadow-xs rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" /> Create Issue
        </Button>
      </div>

      {/* Middle: Search Box */}
      <div className="hidden sm:flex items-center relative max-w-xs w-full mx-4">
        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search tickets, tags, or assignees..."
          className="w-full bg-muted/50 focus:bg-background text-foreground placeholder:text-muted-foreground text-xs rounded-lg pl-8 pr-3 py-1.5 border border-transparent focus:border-ring focus:outline-none transition-all duration-200 shadow-2xs"
        />
      </div>

      {/* Right Controls: Theme Toggle & User Profile */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                {user?.name?.substring(0, 2) || 'TF'}
              </div>
            )}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showUserDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-60 bg-card border border-border rounded-xl shadow-xl py-2 z-50 text-foreground"
                onClick={() => setShowUserDropdown(false)}
              >
                <div className="px-3 py-2 border-b border-border/60">
                  {user?.name && <div className="font-semibold text-xs truncate">{user.name}</div>}
                  {user?.email && <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>}
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    {myRole ? myRole.charAt(0).toUpperCase() + myRole.slice(1) : (user?.role || 'Workspace member')}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/board"
                    className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Kanban className="w-3.5 h-3.5 text-muted-foreground" /> Board View
                  </Link>
                  <Link
                    href="/list"
                    className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-muted-foreground" /> All Issues
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" /> Workspace Metrics
                  </Link>
                </div>

                <div className="border-t border-border/60 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
