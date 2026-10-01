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
  Flame,
  ExternalLink,
} from 'lucide-react';
import { JiraTicket, TicketPriority, TicketType } from '../types/jira';

interface TicketCardProps {
  ticket: JiraTicket;
  onEdit: (ticket: JiraTicket) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, ticket: JiraTicket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onEdit,
  onDelete,
  onDragStart,
}) => {
  const getPriorityIcon = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span title="Urgent Priority" className="text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
            <ChevronsUp className="w-4 h-4 stroke-[3]" />
          </span>
        );
      case 'high':
        return (
          <span title="High Priority" className="text-[#DE350B] flex items-center gap-0.5 font-bold">
            <ChevronUp className="w-4 h-4 stroke-[3]" />
          </span>
        );
      case 'medium':
        return (
          <span title="Medium Priority" className="text-[#FF9900]">
            <Equal className="w-4 h-4 stroke-[3]" />
          </span>
        );
      case 'low':
      default:
        return (
          <span title="Low Priority" className="text-[#36B37E]">
            <ChevronDown className="w-4 h-4 stroke-[3]" />
          </span>
        );
    }
  };

  const getTypeIcon = (type: TicketType) => {
    switch (type) {
      case 'bug':
        return (
          <span title="Bug">
            <Bug className="w-3.5 h-3.5 text-[#E5493A] fill-red-100 dark:fill-red-950" />
          </span>
        );
      case 'story':
        return (
          <span title="User Story">
            <Bookmark className="w-3.5 h-3.5 text-[#36B37E] fill-emerald-100 dark:fill-emerald-950" />
          </span>
        );
      case 'epic':
        return (
          <span title="Epic">
            <Zap className="w-3.5 h-3.5 text-[#6554C0] fill-purple-100 dark:fill-purple-950" />
          </span>
        );
      case 'task':
      default:
        return (
          <span title="Task">
            <CheckSquare className="w-3.5 h-3.5 text-[#4C9AFF] fill-blue-100 dark:fill-blue-950" />
          </span>
        );
    }
  };

  const getPriorityBorderClass = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent-border';
      case 'high': return 'priority-high-border';
      case 'medium': return 'priority-medium-border';
      case 'low': return 'priority-low-border';
      default: return '';
    }
  };

  // SSR-safe HTML tag stripping for preview
  const getCleanSnippet = (html: string) => {
    if (!html) return '';
    const clean = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    return clean.length > 80 ? clean.substring(0, 80) + '...' : clean;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, ticket)}
      className={`jira-card bg-card text-card-foreground border border-border p-3 rounded cursor-grab active:cursor-grabbing hover:shadow-md group relative transition select-none ${getPriorityBorderClass(
        ticket.priority
      )}`}
    >
      {/* Title & Quick Actions */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <Link
          href={`/tickets/${ticket.id}`}
          className="text-xs font-semibold text-foreground leading-snug line-clamp-2 hover:text-[#0052CC] dark:hover:text-blue-400 transition"
        >
          {ticket.title}
        </Link>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
          <Link
            href={`/tickets/${ticket.id}`}
            title="Open Details Page"
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition"
          >
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={() => onEdit(ticket)}
            title="Edit Issue"
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(ticket.id)}
            title="Delete Issue"
            className="p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-muted-foreground hover:text-red-600 transition"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Description Snippet */}
      {ticket.description && (
        <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2 leading-tight font-normal">
          {getCleanSnippet(ticket.description)}
        </p>
      )}

      {/* Jira Card Footer: Issue Type, Key, Priority, Points, Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
        {/* Left: Type Icon + Issue Key */}
        <div className="flex items-center gap-1.5">
          {getTypeIcon(ticket.type)}
          <Link
            href={`/tickets/${ticket.id}`}
            className="font-semibold text-[11px] text-muted-foreground hover:text-[#0052CC] dark:hover:text-blue-400 cursor-pointer"
          >
            {ticket.key}
          </Link>
          {ticket.priority === 'high' && (
            <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5" /> High
            </span>
          )}
        </div>

        {/* Right: Priority Icon + Story Points + Assignee Avatar */}
        <div className="flex items-center gap-2">
          {getPriorityIcon(ticket.priority)}

          {/* Story Points Circle */}
          <span
            title={`${ticket.storyPoints} Story Points`}
            className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center border border-border"
          >
            {ticket.storyPoints}
          </span>

          {/* Assignee Avatar */}
          {ticket.assignee && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ticket.assignee.avatar}
              alt={ticket.assignee.name}
              title={`Assigned to ${ticket.assignee.name}`}
              className="w-5 h-5 rounded-full object-cover border border-background shadow-2xs"
            />
          )}
        </div>
      </div>
    </div>
  );
};
