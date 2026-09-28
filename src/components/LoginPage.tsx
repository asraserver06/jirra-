import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSession } from '../context/AuthContext';
import { MOCK_USERS } from '../data/mockData';

export const LoginPage: React.FC = () => {
  const { signIn } = useSession();
  const [email, setEmail] = useState('alex.mercer@acme-jira.io');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState('');

  const singleUser = MOCK_USERS[0]; // Alex Mercer

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    signIn(singleUser.id);
  };

  return (
    <div className="min-h-screen bg-[#0747A6] flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0052cc15_1px,transparent_1px),linear-gradient(to_bottom,#0052cc15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Atlassian Jira Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white text-[#0747A6] font-black text-2xl shadow-xl mb-3">
            J
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Log in to Jira Software</h1>
          <p className="text-xs text-blue-200 mt-1">Enterprise Agile Kanban & Formatted Issue Tracker</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl border border-blue-100 text-[#172B4D]">
          {/* User Avatar Badge */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6">
            <img
              src={singleUser.avatar}
              alt={singleUser.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-sm"
            />
            <div>
              <p className="text-xs font-bold text-[#172B4D]">{singleUser.name}</p>
              <p className="text-[11px] text-[#5E6C84]">{singleUser.role}</p>
            </div>
            <span className="ml-auto bg-blue-100 text-[#0052CC] text-[10px] font-bold px-2 py-0.5 rounded-full">
              Primary Account
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5E6C84] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-[#DFE1E6] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#172B4D] font-medium outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5E6C84] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-50 border border-[#DFE1E6] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#172B4D] font-medium outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition transform active:scale-98"
            >
              <span>Log in to Jira Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#DFE1E6] flex items-center justify-center gap-1.5 text-[11px] text-[#5E6C84]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Single User Authenticated Account</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-blue-200 mt-6">
          Atlassian Jira Software Workspace &bull; Single Person Account
        </p>
      </div>
    </div>
  );
};
