import React from 'react';
import { TrendingUp, CheckCircle2, Clock, Layers } from 'lucide-react';
import { JiraTicket } from '../types/jira';

interface ProgressBarProps {
  tickets: JiraTicket[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ tickets }) => {
  const totalTickets = tickets.length;
  const doneTickets = tickets.filter((t) => t.status === 'done').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress').length;
  const inReviewTickets = tickets.filter((t) => t.status === 'in_review').length;
  const todoTickets = tickets.filter((t) => t.status === 'todo').length;

  const totalPoints = tickets.reduce((acc, t) => acc + t.storyPoints, 0);
  const donePoints = tickets
    .filter((t) => t.status === 'done')
    .reduce((acc, t) => acc + t.storyPoints, 0);

  const percentComplete = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;
  const pointsPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-lg p-3.5 shadow-xs mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-emerald-100 text-[#36B37E] flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[#172B4D]">Sprint 42 Completion Progress</h3>
              <span className="bg-blue-50 text-[#0052CC] text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                Active Sprint
              </span>
            </div>
            <p className="text-[11px] text-[#5E6C84]">Sprint Goal: Complete core auth & drag drop Kanban UI</p>
          </div>
        </div>

        {/* Sprint Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider block">Completed</span>
            <span className="font-bold text-[#36B37E]">
              {doneTickets}/{totalTickets} issues ({percentComplete}%)
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div>
            <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider block">Story Points</span>
            <span className="font-bold text-[#0052CC]">
              {donePoints} / {totalPoints} pts
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EBECF0] rounded-full h-2.5 overflow-hidden flex">
        <div
          style={{ width: `${(doneTickets / (totalTickets || 1)) * 100}%` }}
          className="bg-[#36B37E] h-full transition-all duration-300"
          title={`Done: ${doneTickets}`}
        />
        <div
          style={{ width: `${(inReviewTickets / (totalTickets || 1)) * 100}%` }}
          className="bg-[#FF9900] h-full transition-all duration-300"
          title={`In Review: ${inReviewTickets}`}
        />
        <div
          style={{ width: `${(inProgressTickets / (totalTickets || 1)) * 100}%` }}
          className="bg-[#0052CC] h-full transition-all duration-300"
          title={`In Progress: ${inProgressTickets}`}
        />
      </div>
    </div>
  );
};
