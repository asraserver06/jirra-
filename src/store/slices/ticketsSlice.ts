import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { JiraTicket, TicketStatus } from '@/types/jira';
import { INITIAL_TICKETS } from '@/data/mockData';

export interface TicketsState {
  tickets: JiraTicket[];
  selectedTicket: JiraTicket | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const getStoredTickets = (): JiraTicket[] => {
  if (typeof window === 'undefined') return INITIAL_TICKETS;
  try {
    const saved = localStorage.getItem('jira_tickets_data');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load tickets from localStorage', e);
  }
  return INITIAL_TICKETS;
};

const initialState: TicketsState = {
  tickets: getStoredTickets(),
  selectedTicket: null,
  status: 'idle',
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: INITIAL_TICKETS.length,
    totalPages: 1,
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jira_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (
    params: { status?: string; priority?: string; search?: string; page?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.status && params.status !== 'all') searchParams.append('status', params.status);
      if (params.priority && params.priority !== 'all') searchParams.append('priority', params.priority);
      if (params.search) searchParams.append('search', params.search);
      if (params.page) searchParams.append('page', params.page.toString());

      const url = `${API_BASE}/api/tickets?${searchParams.toString()}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();

      if (!res.ok || !json.success) {
        return rejectWithValue(json.message || 'Failed to fetch tickets');
      }
      return json; // { data: tickets, pagination: {...} }
    } catch {
      // Graceful fallback to local tickets
      return { data: getStoredTickets(), pagination: { page: 1, limit: 50, total: 10, totalPages: 1 } };
    }
  }
);

export const createTicketThunk = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData: Partial<JiraTicket>, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return rejectWithValue(json.message || 'Failed to create ticket');
      }
      return json.data;
    } catch {
      // Fallback local create
      const newTicket: JiraTicket = {
        id: `t-${Date.now()}`,
        key: `PROJ-${Math.floor(100 + Math.random() * 900)}`,
        title: ticketData.title || 'Untitled Ticket',
        description: ticketData.description || '',
        status: ticketData.status || 'todo',
        priority: ticketData.priority || 'medium',
        type: ticketData.type || 'story',
        assignee: ticketData.assignee || INITIAL_TICKETS[0].assignee,
        reporter: ticketData.reporter || INITIAL_TICKETS[0].reporter,
        storyPoints: ticketData.storyPoints || 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newTicket;
    }
  }
);

export const updateTicketThunk = createAsyncThunk(
  'tickets/updateTicket',
  async (ticketData: JiraTicket, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketData.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return rejectWithValue(json.message || 'Failed to update ticket');
      }
      return json.data;
    } catch {
      return ticketData;
    }
  }
);

export const updateTicketStatusThunk = createAsyncThunk(
  'tickets/updateTicketStatus',
  async ({ ticketId, newStatus }: { ticketId: string; newStatus: TicketStatus }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return rejectWithValue(json.message || 'Failed to update ticket status');
      }
      return { ticketId, newStatus, ticket: json.data };
    } catch {
      return { ticketId, newStatus };
    }
  }
);

export const deleteTicketThunk = createAsyncThunk(
  'tickets/deleteTicket',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return rejectWithValue(json.message || 'Failed to delete ticket');
      }
      return ticketId;
    } catch {
      return ticketId;
    }
  }
);

export const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setSelectedTicket: (state, action: PayloadAction<JiraTicket | null>) => {
      state.selectedTicket = action.payload;
    },
    moveTicketOptimistic: (
      state,
      action: PayloadAction<{ ticketId: string; newStatus: TicketStatus }>
    ) => {
      const { ticketId, newStatus } = action.payload;
      state.tickets = state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_tickets_data', JSON.stringify(state.tickets));
      }
    },
    saveTicketLocal: (state, action: PayloadAction<Partial<JiraTicket>>) => {
      const ticketData = action.payload;
      if (ticketData.id) {
        state.tickets = state.tickets.map((t) =>
          t.id === ticketData.id
            ? ({ ...t, ...ticketData, updatedAt: new Date().toISOString() } as JiraTicket)
            : t
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
          assignee: ticketData.assignee || state.tickets[0]?.assignee || INITIAL_TICKETS[0].assignee,
          reporter: ticketData.reporter || state.tickets[0]?.reporter || INITIAL_TICKETS[0].reporter,
          storyPoints: ticketData.storyPoints || 3,
          fontFamily: ticketData.fontFamily || 'Inter, sans-serif',
          alignment: ticketData.alignment || 'left',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.tickets.unshift(newTicket);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_tickets_data', JSON.stringify(state.tickets));
      }
    },
    deleteTicketLocal: (state, action: PayloadAction<string>) => {
      state.tickets = state.tickets.filter((t) => t.id !== action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_tickets_data', JSON.stringify(state.tickets));
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchTickets.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchTickets.fulfilled, (state, action) => {
      state.status = 'succeeded';
      if (Array.isArray(action.payload.data) && action.payload.data.length > 0) {
        state.tickets = action.payload.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('jira_tickets_data', JSON.stringify(action.payload.data));
        }
      }
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
    });
    builder.addCase(fetchTickets.rejected, (state, action) => {
      state.status = 'failed';
      state.error = (action.payload as string) || 'Could not fetch tickets';
    });

    // Create
    builder.addCase(createTicketThunk.fulfilled, (state, action) => {
      const exists = state.tickets.some((t) => t.id === action.payload.id);
      if (!exists) {
        state.tickets.unshift(action.payload);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_tickets_data', JSON.stringify(state.tickets));
      }
    });

    // Update
    builder.addCase(updateTicketThunk.fulfilled, (state, action) => {
      state.tickets = state.tickets.map((t) =>
        t.id === action.payload.id ? action.payload : t
      );
      if (state.selectedTicket?.id === action.payload.id) {
        state.selectedTicket = action.payload;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_tickets_data', JSON.stringify(state.tickets));
      }
    });

    // Update Status
    builder.addCase(updateTicketStatusThunk.fulfilled, (state, action) => {
      const { ticketId, newStatus, ticket } = action.payload;
      state.tickets = state.tickets.map((t) => {
        if (t.id === ticketId) {
          return ticket ? { ...t, ...ticket } : { ...t, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return t;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_tickets_data', JSON.stringify(state.tickets));
      }
    });

    // Delete
    builder.addCase(deleteTicketThunk.fulfilled, (state, action) => {
      state.tickets = state.tickets.filter((t) => t.id !== action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_tickets_data', JSON.stringify(state.tickets));
      }
    });
  },
});

export const {
  setSelectedTicket,
  moveTicketOptimistic,
  saveTicketLocal,
  deleteTicketLocal,
} = ticketsSlice.actions;

export default ticketsSlice.reducer;
