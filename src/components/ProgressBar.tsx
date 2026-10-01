"use client";

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

  const totalPoints = tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const donePoints = tickets
    .filter((t) => t.status === 'done')
    .reduce((acc, t) => acc + (t.storyPoints || 0), 0);

  const percentComplete = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;
  const pointsPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 shadow-2xs mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">Sprint 14 Completion Progress</h3>
              <span className="bg-blue-50 dark:bg-blue-950/60 text-[#0052CC] dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-900">
                Active Sprint
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Sprint Goal: Deliver full-stack Jira clone with Next.js & Express REST API</p>
          </div>
        </div>

        {/* Sprint Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Completed</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {doneTickets}/{totalTickets} issues ({percentComplete}%)
            </span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Story Points</span>
            <span className="font-bold text-[#0052CC] dark:text-blue-400">
              {donePoints} / {totalPoints} pts ({pointsPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex shadow-inner">
        <div
          title={`Done: ${doneTickets} tickets`}
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${totalTickets > 0 ? (doneTickets / totalTickets) * 100 : 0}%` }}
        />
        <div
          title={`In Review: ${inReviewTickets} tickets`}
          className="bg-amber-500 h-full transition-all duration-300"
          style={{ width: `${totalTickets > 0 ? (inReviewTickets / totalTickets) * 100 : 0}%` }}
        />
        <div
          title={`In Progress: ${inProgressTickets} tickets`}
          className="bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${totalTickets > 0 ? (inProgressTickets / totalTickets) * 100 : 0}%` }}
        />
        <div
          title={`To Do: ${todoTickets} tickets`}
          className="bg-slate-300 dark:bg-slate-700 h-full transition-all duration-300"
          style={{ width: `${totalTickets > 0 ? (todoTickets / totalTickets) * 100 : 0}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Done ({doneTickets})</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>In Review ({inReviewTickets})</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>In Progress ({inProgressTickets})</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span>To Do ({todoTickets})</span>
        </div>
      </div>
    </div>
  );
};
