"use client";

import React from 'react';
import { Search, Flame } from 'lucide-react';
import { TicketPriority, JiraTicket } from '../types/jira';
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 py-2 border-b border-border/60">
      {/* Left: Search + Member Avatars */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-48 sm:w-60">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter board..."
            className="w-full bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground rounded-xl border border-border/80 pl-8 pr-3 py-1.5 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
          />
        </div>

        {/* Assignee Avatar Filter Row */}
        <div className="flex items-center gap-1.5 border-l border-border/60 pl-3">
          <span className="text-[11px] font-medium text-muted-foreground mr-1 hidden sm:inline">Assignees:</span>
          {MOCK_USERS.map((user) => {
            const isSelected = selectedAssigneeId === user.id;
            return (
              <button
                key={user.id}
                onClick={() => onAssigneeChange(isSelected ? null : user.id)}
                title={`Filter by ${user.name}`}
                className={`w-7 h-7 rounded-full overflow-hidden transition-all duration-150 border-2 ${
                  isSelected ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-transparent opacity-75 hover:opacity-100'
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
              className="text-[10px] text-muted-foreground hover:text-foreground font-semibold ml-1 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right: Modern Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => onPriorityChange('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedPriority === 'all'
              ? 'bg-foreground text-background shadow-2xs'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          All Issues ({tickets.length})
        </button>

        <button
          onClick={() => onPriorityChange('high_urgent')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            selectedPriority === 'high_urgent'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          High Priority ({highPriorityCount})
        </button>

        <button
          onClick={() => onPriorityChange('urgent')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedPriority === 'urgent'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Urgent Only
        </button>
      </div>
    </div>
  );
};
