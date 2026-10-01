"use client";

import React from 'react';
import { Search, Flame, Filter, Zap, CheckCircle2, User as UserIcon } from 'lucide-react';
import { TicketPriority, JiraTicket, User } from '../types/jira';
import { MOCK_USERS } from '../data/mockData';

interface PriorityFilterProps {
  tickets: JiraTicket[];
  selectedPriority: TicketPriority | 'all' | 'high_urgent';
  onPriorityChange: (priority: TicketPriority | 'all' | 'high_urgent') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedAssigneeId: string | null;
  onAssigneeChange: (assigneeId: string | null) => void;
}

export const PriorityFilter: React.FC<PriorityFilterProps> = ({
  tickets,
  selectedPriority,
  onPriorityChange,
  searchQuery,
  onSearchChange,
  selectedAssigneeId,
  onAssigneeChange,
}) => {
  const highPriorityCount = tickets.filter(
    (t) => (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'done'
  ).length;

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5 py-2 border-b border-border">
      {/* Left: Search + Assignee Avatars Filter */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Board Input */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search this board..."
            className="w-full bg-background text-xs text-foreground placeholder-muted-foreground rounded border border-border pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* Assignee Avatar Filter Row */}
        <div className="flex items-center gap-1 border-l border-border pl-3">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline">Members:</span>
          {MOCK_USERS.map((user) => {
            const isSelected = selectedAssigneeId === user.id;
            return (
              <button
                key={user.id}
                onClick={() => onAssigneeChange(isSelected ? null : user.id)}
                title={`Filter by ${user.name}`}
                className={`w-7 h-7 rounded-full overflow-hidden transition border-2 ${
                  isSelected ? 'border-[#0052CC] ring-2 ring-blue-300 scale-110' : 'border-background opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </button>
            );
          })}
          {selectedAssigneeId && (
            <button
              onClick={() => onAssigneeChange(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground font-semibold ml-1 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right: Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => onPriorityChange('all')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
            selectedPriority === 'all'
              ? 'bg-[#0052CC] text-white shadow-xs'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Issues ({tickets.length})
        </button>

        <button
          onClick={() => onPriorityChange('high_urgent')}
          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
            selectedPriority === 'high_urgent'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-red-500" />
          High Priority ({highPriorityCount})
        </button>

        <button
          onClick={() => onPriorityChange('urgent')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
            selectedPriority === 'urgent'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Urgent Only
        </button>
      </div>
    </div>
  );
};
