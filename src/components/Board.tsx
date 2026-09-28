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
        const colStoryPoints = colTickets.reduce((sum, t) => sum + t.storyPoints, 0);
        const isDropTarget = activeDropColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col min-h-[560px] rounded-lg p-2.5 transition-all duration-150 border ${
              isDropTarget ? 'jira-drop-target' : 'bg-[#F4F5F7] border-[#DFE1E6]'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E6C84]">
                  {column.title}
                </h3>
                <span className="bg-[#DFE1E6] text-[#42526E] text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {colTickets.length}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#5E6C84]">
                <span>{colStoryPoints} pts</span>
                <button className="p-1 hover:bg-[#DFE1E6] rounded text-[#5E6C84] transition">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ticket List Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5 min-h-[440px]">
              {colTickets.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-[#DFE1E6] rounded-lg p-3 text-center">
                  <p className="text-xs text-[#5E6C84] font-medium">No issues in stage</p>
                  <p className="text-[10px] text-[#A5ADBA]">Drag issue cards here</p>
                </div>
              ) : (
                colTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onEdit={onEditTicket}
                    onDelete={onDeleteTicket}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>

            {/* Quick Add Issue Button */}
            <button
              onClick={() => onOpenCreateModal(column.id)}
              className="mt-2.5 w-full py-1.5 px-2 rounded hover:bg-[#EBECF0] text-[#42526E] hover:text-[#0052CC] text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Create issue
            </button>
          </div>
        );
      })}
    </div>
  );
};
