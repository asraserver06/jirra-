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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5 py-2 border-b border-[#DFE1E6]">
      {/* Left: Search + Assignee Avatars Filter */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Board Input */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#5E6C84] absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search this board..."
            className="w-full bg-white text-xs text-[#172B4D] placeholder-[#6B778C] rounded border border-[#DFE1E6] pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#4C9AFF] focus:ring-1 focus:ring-[#4C9AFF] transition"
          />
        </div>

        {/* Assignee Avatar Filter Row */}
        <div className="flex items-center gap-1 border-l border-[#DFE1E6] pl-3">
          <span className="text-[11px] font-semibold text-[#5E6C84] mr-1 hidden sm:inline">Members:</span>
          {MOCK_USERS.map((user) => {
            const isSelected = selectedAssigneeId === user.id;
            return (
              <button
                key={user.id}
                onClick={() => onAssigneeChange(isSelected ? null : user.id)}
                title={`Filter by ${user.name}`}
                className={`w-7 h-7 rounded-full overflow-hidden transition border-2 ${
                  isSelected ? 'border-[#0052CC] ring-2 ring-blue-300 scale-110' : 'border-white opacity-70 hover:opacity-100'
                }`}
              >
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </button>
            );
          })}

          {selectedAssigneeId && (
            <button
              onClick={() => onAssigneeChange(null)}
              className="text-[11px] text-[#0052CC] hover:underline font-semibold ml-1"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Right: Quick Filters (High Priority, Medium, Low, All) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-[#5E6C84] mr-1">Quick Filters:</span>

        {/* All Issues */}
        <button
          onClick={() => onPriorityChange('all')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
            selectedPriority === 'all'
              ? 'bg-[#EBECF0] text-[#0052CC] font-bold'
              : 'text-[#42526E] hover:bg-[#F4F5F7]'
          }`}
        >
          All issues ({tickets.length})
        </button>

        {/* 🔥 High & Urgent Priority Button */}
        <button
          onClick={() => onPriorityChange('high_urgent')}
          className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition ${
            selectedPriority === 'high_urgent'
              ? 'bg-red-100 text-[#DE350B] ring-1 ring-red-400'
              : 'text-[#DE350B] hover:bg-red-50'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-[#DE350B]" />
          High Priority ({highPriorityCount})
        </button>

        {/* Low Priority */}
        <button
          onClick={() => onPriorityChange('low')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
            selectedPriority === 'low'
              ? 'bg-emerald-100 text-[#36B37E] font-bold'
              : 'text-[#36B37E] hover:bg-emerald-50'
          }`}
        >
          Low Priority
        </button>
      </div>
    </div>
  );
};
