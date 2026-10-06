"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pb-12">
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
            className={`flex flex-col rounded-2xl bg-muted/40 border transition-all duration-200 min-h-[500px] ${
              isDropTarget
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'border-border/70'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                  {column.title}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground shadow-2xs">
                  {colTickets.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {colStoryPoints} pts
                </span>
                <button
                  onClick={() => onOpenCreateModal(column.id)}
                  title="Create issue in column"
                  className="p-1 hover:bg-background border border-transparent hover:border-border rounded-lg text-muted-foreground hover:text-foreground transition-all shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Column Ticket Stream */}
            <div className="p-2.5 space-y-2.5 flex-1">
              <AnimatePresence mode="popLayout">
                {colTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                  >
                    <TicketCard
                      ticket={ticket}
                      onEdit={onEditTicket}
                      onDelete={onDeleteTicket}
                      onDragStart={handleDragStart}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {colTickets.length === 0 && (
                <div className="h-36 flex flex-col items-center justify-center border border-dashed border-border/80 rounded-xl text-muted-foreground/60 text-xs">
                  <span>No tasks here</span>
                  <button
                    onClick={() => onOpenCreateModal(column.id)}
                    className="text-[11px] text-primary hover:underline mt-1.5 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Add task
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
