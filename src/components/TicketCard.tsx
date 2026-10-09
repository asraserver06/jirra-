"use client";

import React from 'react';
import Link from 'next/link';
import {
  ChevronUp,
  ChevronsUp,
  ChevronDown,
  Equal,
  Bookmark,
  Bug,
  CheckSquare,
  Zap,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { JiraTicket, TicketPriority, TicketType } from '../types/jira';

interface TicketCardProps {
  ticket: JiraTicket;
  onEdit: (ticket: JiraTicket) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, ticket: JiraTicket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onEdit,
  onDelete,
  onDragStart,
}) => {
  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <ChevronsUp className="w-3 h-3 stroke-[3]" /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ChevronUp className="w-3 h-3 stroke-[3]" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Equal className="w-3 h-3 stroke-[3]" /> Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ChevronDown className="w-3 h-3 stroke-[3]" /> Low
          </span>
        );
    }
  };

  const getTypeIcon = (type: TicketType) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      case 'story':
        return <Bookmark className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'epic':
        return <Zap className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
      case 'task':
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    }
  };

  const getCleanSnippet = (html: string) => {
    if (!html) return '';
    const clean = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    return clean.length > 70 ? clean.substring(0, 70) + '...' : clean;
  };

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, ticket)}
      className="bg-card text-card-foreground border border-border/80 p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:-translate-y-0.5 active:scale-[0.98] hover:border-foreground/20 hover:shadow-md group relative select-none transition-all"
    >
      {/* Header: Priority Badge & Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {getTypeIcon(ticket.type)}
          <span className="font-mono text-[11px] font-semibold text-muted-foreground">
            {ticket.key}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {getPriorityBadge(ticket.priority)}

          {/* Quick Hover Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 ml-1">
            <Link
              href={`/tickets/${ticket.id}`}
              title="Open Details"
              className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={() => onEdit(ticket)}
              title="Edit Issue"
              className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(ticket.id)}
              title="Delete Issue"
              className="p-1 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Title */}
      <Link
        href={`/tickets/${ticket.id}`}
        className="text-xs font-semibold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors block mb-1.5"
      >
        {ticket.title}
      </Link>

      {/* Description Preview */}
      {ticket.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-normal mb-3 font-normal">
          {getCleanSnippet(ticket.description)}
        </p>
      )}

      {/* Footer: Story Points & Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
        <span
          title={`${ticket.storyPoints} Story Points`}
          className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold border border-border/60"
        >
          {ticket.storyPoints} pts
        </span>

        {ticket.assignee && (
          <div className="flex items-center gap-1.5" title={`Assigned to ${ticket.assignee.name}`}>
            <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
              {ticket.assignee.name.split(' ')[0]}
            </span>
            {ticket.assignee.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ticket.assignee.avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-background shadow-2xs" />
            ) : (
              <span aria-hidden="true" className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px]">
                {ticket.assignee.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
