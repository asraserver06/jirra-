import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { JiraTicket, TicketStatus } from '@/types/jira';
import { api, apiErrorMessage } from '@/lib/api';
import { logout } from './authSlice';
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

const initialState: TicketsState = {
  tickets: [],
  selectedTicket: null,
  status: 'idle',
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  },
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

      const response = await api.get(`/api/tickets?${searchParams.toString()}`);
      const json = response.data;

      if (!json.success) {
        return rejectWithValue(json.message || 'Failed to fetch tickets');
      }
      return json; // { data: tickets, pagination: {...} }
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to fetch issues.'));
    }
  }
);

export const createTicketThunk = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData: Partial<JiraTicket>, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/tickets', {
        ...ticketData,
        assignee: ticketData.assignee?.id,
        reporter: ticketData.reporter?.id,
      });
      const json = response.data;
      if (!json.success) {
        return rejectWithValue(json.message || 'Failed to create ticket');
      }
      return json.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to create issue.'));
    }
  }
);

export const updateTicketThunk = createAsyncThunk(
  'tickets/updateTicket',
  async (ticketData: JiraTicket, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/tickets/${ticketData.id}`, {
        ...ticketData,
        assignee: ticketData.assignee?.id,
        reporter: ticketData.reporter?.id,
      });
      const json = response.data;
      if (!json.success) {
        return rejectWithValue(json.message || 'Failed to update ticket');
      }
      return json.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to update issue.'));
    }
  }
);

export const updateTicketStatusThunk = createAsyncThunk(
  'tickets/updateTicketStatus',
  async ({ ticketId, newStatus }: { ticketId: string; newStatus: TicketStatus }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/tickets/${ticketId}/status`, { status: newStatus });
      const json = response.data;
      if (!json.success) {
        return rejectWithValue(json.message || 'Failed to update ticket status');
      }
      return { ticketId, newStatus, ticket: json.data };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to update issue status.'));
    }
  }
);

export const deleteTicketThunk = createAsyncThunk(
  'tickets/deleteTicket',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/tickets/${ticketId}`);
      const json = response.data;
      if (!json.success) {
        return rejectWithValue(json.message || 'Failed to delete ticket');
      }
      return ticketId;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to delete issue.'));
    }
  }
);

export const addTicketComment = createAsyncThunk(
  'tickets/addComment',
  async ({ ticketId, text }: { ticketId: string; text: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/tickets/${ticketId}/comments`, { text });
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to add comment.');
      }
      return response.data.data as JiraTicket;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to add comment.'));
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
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.tickets = [];
      state.selectedTicket = null;
      state.status = 'idle';
      state.error = null;
      state.pagination = { page: 1, limit: 50, total: 0, totalPages: 1 };
    });

    // Fetch
    builder.addCase(fetchTickets.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchTickets.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.tickets = Array.isArray(action.payload.data) ? action.payload.data : [];
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
    });

    // Update
    builder.addCase(updateTicketThunk.fulfilled, (state, action) => {
      state.tickets = state.tickets.map((t) =>
        t.id === action.payload.id ? action.payload : t
      );
      if (state.selectedTicket?.id === action.payload.id) {
        state.selectedTicket = action.payload;
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
    });

    // Delete
    builder.addCase(deleteTicketThunk.fulfilled, (state, action) => {
      state.tickets = state.tickets.filter((t) => t.id !== action.payload);
    });

    builder.addCase(addTicketComment.fulfilled, (state, action) => {
      state.tickets = state.tickets.map((ticket) =>
        ticket.id === action.payload.id ? action.payload : ticket
      );
      if (state.selectedTicket?.id === action.payload.id) {
        state.selectedTicket = action.payload;
      }
    });
  },
});

export const { setSelectedTicket, moveTicketOptimistic } = ticketsSlice.actions;

export default ticketsSlice.reducer;
