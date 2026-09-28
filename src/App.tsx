import React, { useState, useEffect } from 'react';
import { SessionProvider, useSession } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProgressBar } from './components/ProgressBar';
import { PriorityFilter } from './components/PriorityFilter';
import { Board } from './components/Board';
import { TicketModal } from './components/TicketModal';
import { LoginPage } from './components/LoginPage';
import { JiraTicket, TicketPriority, TicketStatus } from './types/jira';
import { INITIAL_TICKETS } from './data/mockData';
import { ChevronRight, Plus } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { session } = useSession();

  const [tickets, setTickets] = useState<JiraTicket[]>(() => {
    const saved = localStorage.getItem('jira_tickets_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load tickets from storage', e);
      }
    }
    return INITIAL_TICKETS;
  });

  const [activeTab, setActiveTab] = useState('kanban');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<TicketPriority | 'all' | 'high_urgent'>('all');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<JiraTicket | null>(null);
  const [createInitialStatus, setCreateInitialStatus] = useState<TicketStatus>('todo');

  useEffect(() => {
    localStorage.setItem('jira_tickets_data', JSON.stringify(tickets));
  }, [tickets]);

  // If user is signed out, render dedicated Login Page!
  if (session.status === 'unauthenticated' || !session.user) {
    return <LoginPage />;
  }

  const handleMoveTicket = (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const handleSaveTicket = (ticketData: Partial<JiraTicket>) => {
    if (ticketData.id) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketData.id
            ? ({ ...t, ...ticketData, updatedAt: new Date().toISOString() } as JiraTicket)
            : t
        )
      );
    } else {
      const newTicket: JiraTicket = {
        id: `t-${Date.now()}`,
        key: ticketData.key || `PROJ-${Math.floor(100 + Math.random() * 900)}`,
        title: ticketData.title || 'Untitled Ticket',
        description: ticketData.description || '',
        status: ticketData.status || 'todo',
        priority: ticketData.priority || 'medium',
        type: ticketData.type || 'story',
        assignee: ticketData.assignee || tickets[0].assignee,
        reporter: ticketData.reporter || tickets[0].reporter,
        storyPoints: ticketData.storyPoints || 3,
        fontFamily: ticketData.fontFamily || 'Inter, sans-serif',
        alignment: ticketData.alignment || 'left',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTickets((prev) => [newTicket, ...prev]);
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (confirm('Are you sure you want to delete this Jira ticket?')) {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    }
  };

  const handleOpenCreateModal = (status: TicketStatus = 'todo') => {
    setTicketToEdit(null);
    setCreateInitialStatus(status);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ticket: JiraTicket) => {
    setTicketToEdit(ticket);
    setIsModalOpen(true);
  };

  // Filter tickets by search, priority filter, and assignee filter
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedAssigneeId && t.assignee.id !== selectedAssigneeId) {
      return false;
    }

    if (selectedPriorityFilter === 'all') return true;
    if (selectedPriorityFilter === 'high_urgent') {
      return t.priority === 'high' || t.priority === 'urgent';
    }
    return t.priority === selectedPriorityFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] text-[#172B4D] font-sans antialiased">
      {/* Top Navigation Header */}
      <Navbar
        onOpenCreateModal={() => handleOpenCreateModal('todo')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Layout Container with Left Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Atlassian Jira Left Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Jira Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white p-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center gap-1.5 text-xs text-[#5E6C84] mb-2 font-medium">
            <span>Projects</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#0052CC] font-semibold">Acme Software</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#172B4D] font-bold">PROJ board</span>
          </div>

          {/* Board Title & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h1 className="text-xl font-black text-[#172B4D] tracking-tight">
              PROJ board
            </h1>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenCreateModal('todo')}
                className="bg-[#0052CC] hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Create issue
              </button>
            </div>
          </div>

          {/* Sprint Completion Progress Bar Widget */}
          <ProgressBar tickets={tickets} />

          {/* Board Filters & Member Avatars */}
          <PriorityFilter
            tickets={tickets}
            selectedPriority={selectedPriorityFilter}
            onPriorityChange={setSelectedPriorityFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedAssigneeId={selectedAssigneeId}
            onAssigneeChange={setSelectedAssigneeId}
          />

          {/* Jira Kanban Board Engine */}
          <Board
            tickets={filteredTickets}
            onMoveTicket={handleMoveTicket}
            onEditTicket={handleOpenEditModal}
            onDeleteTicket={handleDeleteTicket}
            onOpenCreateModal={handleOpenCreateModal}
          />
        </div>
      </div>

      {/* Create / Edit Issue Modal Drawer */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTicket}
        ticketToEdit={ticketToEdit}
        initialStatus={createInitialStatus}
      />
    </div>
  );
};

export function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App;
