import React, { useState } from 'react';
import {
  Grid,
  Search,
  Bell,
  HelpCircle,
  Plus,
  LogOut,
  LogIn,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { useSession } from '../context/AuthContext';

interface NavbarProps {
  onOpenCreateModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateModal,
  searchQuery,
  onSearchChange,
}) => {
  const { session, signIn, signOut } = useSession();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const currentUser = session.user;

  return (
    <header className="bg-[#0747A6] text-white h-14 border-b border-blue-900 px-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Left: Atlassian App Switcher + Jira Logo */}
      <div className="flex items-center gap-4">
        {/* App Switcher 9-dots */}
        <button className="p-1.5 hover:bg-blue-800 rounded-md text-blue-100 transition">
          <Grid className="w-5 h-5" />
        </button>

        {/* Jira Brand */}
        <div className="flex items-center gap-2 cursor-pointer select-none">
          <div className="w-6 h-6 bg-white text-[#0747A6] rounded font-black flex items-center justify-center text-xs shadow-sm">
            J
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">Jira Software</span>
        </div>

        {/* Header Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-blue-100 ml-2">
          <span className="px-3 py-1.5 hover:bg-blue-800 rounded-md cursor-pointer">Your work</span>
          <span className="px-3 py-1.5 hover:bg-blue-800 rounded-md cursor-pointer">Projects</span>
          <span className="px-3 py-1.5 hover:bg-blue-800 rounded-md cursor-pointer">Filters</span>
          <span className="px-3 py-1.5 hover:bg-blue-800 rounded-md cursor-pointer">Dashboards</span>
        </nav>

        {/* Jira Create Button */}
        <button
          onClick={onOpenCreateModal}
          className="bg-[#0052CC] hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm flex items-center gap-1 transition"
        >
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>

      {/* Middle: Global Search Jira Box */}
      <div className="hidden sm:flex items-center relative max-w-xs w-full">
        <Search className="w-4 h-4 text-blue-300 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Jira..."
          className="w-full bg-blue-900/60 text-white placeholder-blue-300 text-xs rounded-md pl-9 pr-3 py-1.5 border border-blue-800 focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition"
        />
      </div>

      {/* Right: Notifications, Help, Single User Profile & Sign Out */}
      <div className="flex items-center gap-2">
        <button className="p-1.5 hover:bg-blue-800 rounded-full text-blue-200 transition relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-red-400 rounded-full absolute top-1 right-1" />
        </button>

        <button className="p-1.5 hover:bg-blue-800 rounded-full text-blue-200 transition">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Session Profile Dropdown */}
        {session.status === 'authenticated' && currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 p-1 hover:bg-blue-800 rounded-full transition"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-400"
              />
            </button>

            {/* Single User Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 border border-slate-200 rounded-lg shadow-xl p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center gap-2.5">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[10px] text-blue-600 font-medium">{currentUser.role.split('/')[0]}</p>
                  </div>
                </div>

                <div className="px-3 py-1.5 text-[11px] text-[#5E6C84] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Authenticated Account</span>
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-md text-xs font-bold text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="flex items-center gap-1 bg-white text-[#0747A6] px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-50 transition"
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
        )}
      </div>
    </header>
  );
};
