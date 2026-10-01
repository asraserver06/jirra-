"use client";

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  moveTicketOptimistic,
  updateTicketStatusThunk,
  deleteTicketThunk,
  saveTicketLocal,
} from '@/store/slices/ticketsSlice';
import {
  setPriorityFilter,
  setAssigneeFilter,
  setSearchQuery,
  setCreateModalOpen,
  setCreateInitialStatus,
} from '@/store/slices/uiSlice';
import { ProgressBar } from '@/components/ProgressBar';
import { PriorityFilter } from '@/components/PriorityFilter';
import { Board } from '@/components/Board';
import { TicketModal } from '@/components/TicketModal';
import { JiraTicket, TicketStatus } from '@/types/jira';
import { ChevronRight, Plus, Kanban as KanbanIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BoardPage() {
  const dispatch = useAppDispatch();
  const { tickets } = useAppSelector((state) => state.tickets);
  const {
    selectedPriorityFilter,
    selectedAssigneeId,
    searchQuery,
  } = useAppSelector((state) => state.ui);

  const [ticketToEdit, setTicketToEdit] = useState<JiraTicket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleMoveTicket = (ticketId: string, newStatus: TicketStatus) => {
    // 1. Optimistic instant UI update
    dispatch(moveTicketOptimistic({ ticketId, newStatus }));
    // 2. Dispatch network update to Express backend
    dispatch(updateTicketStatusThunk({ ticketId, newStatus }));
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (confirm('Are you sure you want to delete this Jira ticket?')) {
      dispatch(deleteTicketThunk(ticketId));
    }
  };

  const handleOpenCreateModal = (status: TicketStatus = 'todo') => {
    dispatch(setCreateInitialStatus(status));
    dispatch(setCreateModalOpen(true));
  };

  const handleOpenEditModal = (ticket: JiraTicket) => {
    setTicketToEdit(ticket);
    setIsEditModalOpen(true);
  };

  const handleSaveEditTicket = (ticketData: Partial<JiraTicket>) => {
    dispatch(saveTicketLocal(ticketData));
    setIsEditModalOpen(false);
    setTicketToEdit(null);
  };

  // Filter tickets by search, priority filter, and assignee filter
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedAssigneeId && t.assignee?.id !== selectedAssigneeId && (t.assignee as any)?._id !== selectedAssigneeId) {
      return false;
    }

    if (selectedPriorityFilter === 'all') return true;
    if (selectedPriorityFilter === 'high_urgent') {
      return t.priority === 'high' || t.priority === 'urgent';
    }
    return t.priority === selectedPriorityFilter;
  });

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 font-medium">
        <span>Projects</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0052CC] dark:text-blue-400 font-semibold">Acme Software</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-bold">PROJ board</span>
      </div>

      {/* Board Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <KanbanIcon className="w-5 h-5 text-blue-500" />
            PROJ board
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sprint 14 — Active Scrum & Kanban Board
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleOpenCreateModal('todo')}
            variant="jira"
            size="sm"
            className="text-xs font-bold gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create issue
          </Button>
        </div>
      </div>

      {/* Sprint Progress Widget */}
      <ProgressBar tickets={tickets} />

      {/* Board Filters */}
      <PriorityFilter
        tickets={tickets}
        selectedPriority={selectedPriorityFilter}
        onPriorityChange={(p) => dispatch(setPriorityFilter(p))}
        searchQuery={searchQuery}
        onSearchChange={(q) => dispatch(setSearchQuery(q))}
        selectedAssigneeId={selectedAssigneeId}
        onAssigneeChange={(id) => dispatch(setAssigneeFilter(id))}
      />

      {/* Kanban Board Engine */}
      <Board
        tickets={filteredTickets}
        onMoveTicket={handleMoveTicket}
        onEditTicket={handleOpenEditModal}
        onDeleteTicket={handleDeleteTicket}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {/* Edit Issue Modal */}
      {ticketToEdit && (
        <TicketModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setTicketToEdit(null);
          }}
          onSave={handleSaveEditTicket}
          ticketToEdit={ticketToEdit}
          initialStatus={ticketToEdit.status}
        />
      )}
    </div>
  );
}
