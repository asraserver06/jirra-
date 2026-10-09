"use client";

import React from 'react';
import { TrendingUp } from 'lucide-react';
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
    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">Workspace progress</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Issue status and story point progress</p>
          </div>
        </div>

        {/* Sprint Stats */}
        <div className="flex items-center gap-5 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Completed</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {doneTickets}/{totalTickets} tasks ({percentComplete}%)
            </span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Points</span>
            <span className="font-bold text-foreground">
              {donePoints} / {totalPoints} pts ({pointsPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex shadow-inner">
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
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${totalTickets > 0 ? (inProgressTickets / totalTickets) * 100 : 0}%` }}
        />
        <div
          title={`To Do: ${todoTickets} tickets`}
          className="bg-muted-foreground/20 h-full transition-all duration-300"
          style={{ width: `${totalTickets > 0 ? (todoTickets / totalTickets) * 100 : 0}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2.5 text-[10px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Done ({doneTickets})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>In Review ({inReviewTickets})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>In Progress ({inProgressTickets})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <span>To Do ({todoTickets})</span>
        </div>
      </div>
    </div>
  );
};
