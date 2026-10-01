"use client";

import React, { useState } from 'react';
import { Plus, MoreHorizontal, CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';
import { JiraTicket, TicketStatus } from '../types/jira';
import { COLUMNS } from '../data/mockData';
import { TicketCard } from './TicketCard';

interface BoardProps {
  tickets: JiraTicket[];
  onMoveTicket: (ticketId: string, newStatus: TicketStatus) => void;
  onEditTicket: (ticket: JiraTicket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onOpenCreateModal: (status?: TicketStatus) => void;
}

export const Board: React.FC<BoardProps> = ({
  tickets,
  onMoveTicket,
  onEditTicket,
  onDeleteTicket,
  onOpenCreateModal,
}) => {
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<TicketStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, ticket: JiraTicket) => {
    setDraggedTicketId(ticket.id);
    e.dataTransfer.setData('text/plain', ticket.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropColumn !== status) {
      setActiveDropColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('text/plain') || draggedTicketId;
    if (ticketId) {
      onMoveTicket(ticketId, status);
    }
    setDraggedTicketId(null);
    setActiveDropColumn(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-start pb-12">
      {COLUMNS.map((column) => {
        const colTickets = tickets.filter((t) => t.status === column.id);
        const colStoryPoints = colTickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const isDropTarget = activeDropColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col rounded-lg bg-muted/50 border transition-all duration-150 min-h-[460px] ${
              isDropTarget
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                : 'border-border'
            }`}
          >
            {/* Column Header */}
            <div className="p-3 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {column.title}
                </h3>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {colTickets.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {colStoryPoints} pts
                </span>
                <button
                  onClick={() => onOpenCreateModal(column.id)}
                  title="Create issue in this column"
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Column Ticket Stream */}
            <div className="p-2 space-y-2 flex-1">
              {colTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onEdit={onEditTicket}
                  onDelete={onDeleteTicket}
                  onDragStart={handleDragStart}
                />
              ))}

              {colTickets.length === 0 && (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-border rounded text-muted-foreground/60 text-xs">
                  <span>No issues</span>
                  <button
                    onClick={() => onOpenCreateModal(column.id)}
                    className="text-[11px] text-[#0052CC] dark:text-blue-400 hover:underline mt-1 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Create issue
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
