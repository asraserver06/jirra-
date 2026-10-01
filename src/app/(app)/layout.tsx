"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTickets, saveTicketLocal, createTicketThunk, updateTicketThunk } from '@/store/slices/ticketsSlice';
import { setCreateModalOpen } from '@/store/slices/uiSlice';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { TicketModal } from '@/components/TicketModal';
import { JiraTicket } from '@/types/jira';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { isCreateModalOpen, createInitialStatus } = useAppSelector((state) => state.ui);
  const [ticketToEdit, setTicketToEdit] = useState<JiraTicket | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initial fetch from Express API (with graceful fallback to mock data)
    dispatch(fetchTickets({}));
  }, [dispatch]);

  // Auth protection check
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleSaveTicket = async (ticketData: Partial<JiraTicket>) => {
    if (ticketData.id) {
      await dispatch(updateTicketThunk(ticketData as JiraTicket));
    } else {
      await dispatch(createTicketThunk(ticketData));
    }
    dispatch(setCreateModalOpen(false));
    setTicketToEdit(null);
  };

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased overflow-hidden">
      {/* Top Jira Header */}
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Atlassian Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-background p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Global Issue Creation & Edit Modal */}
      <TicketModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          dispatch(setCreateModalOpen(false));
          setTicketToEdit(null);
        }}
        onSave={handleSaveTicket}
        ticketToEdit={ticketToEdit}
        initialStatus={createInitialStatus}
      />
    </div>
  );
}
