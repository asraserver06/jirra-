import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useSession } from '../context/AuthContext';
import { MOCK_USERS } from '../data/mockData';

export const LoginPage: React.FC = () => {
  const { signIn } = useSession();
  const [email, setEmail] = useState('alex.mercer@acme-jira.io');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedUserId, setSelectedUserId] = useState(MOCK_USERS[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(selectedUserId);
  };

  const handleQuickLogin = (userId: string) => {
    setSelectedUserId(userId);
    signIn(userId);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-1">
                Work Email Address
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
                  placeholder="Enter your password"
                  className="w-full bg-slate-50 border border-[#DFE1E6] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#172B4D] font-medium outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition transform active:scale-98"
            >
              <span>Log in to Jira</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DFE1E6]" />
            </div>
            <span className="relative bg-white px-3 text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">
              Or Select Demo Team Persona
            </span>
          </div>

          {/* Demo User Selection Cards */}
          <div className="space-y-2">
            {MOCK_USERS.map((usr) => (
              <button
                key={usr.id}
                type="button"
                onClick={() => handleQuickLogin(usr.id)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#DFE1E6] hover:border-[#0052CC] hover:bg-blue-50/60 transition group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={usr.avatar}
                    alt={usr.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#172B4D] group-hover:text-[#0052CC] transition">
                      {usr.name}
                    </p>
                    <p className="text-[10px] text-[#5E6C84]">{usr.role}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#0052CC] opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                  Log in <UserCheck className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-blue-200 mt-6">
          Atlassian Jira Software Workspace &bull; Secure Authentication Session
        </p>
      </div>
    </div>
  );
};
