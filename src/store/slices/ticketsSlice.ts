import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { JiraTicket, TicketStatus } from '@/types/jira';
import { api, apiErrorMessage } from '@/lib/api';
import { googleLogin, loginUser, logout, registerUser } from './authSlice';
import { fetchMyWorkspace, switchWorkspace } from './workspaceSlice';

export interface TicketsState {
  workspaceId: string | null;
  tickets: JiraTicket[];
  selectedTicket: JiraTicket | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const initialState: TicketsState = {
  workspaceId: null,
  tickets: [],
  selectedTicket: null,
  status: 'idle',
  error: null,
  pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
};

const workspaceFromState = (getState: () => unknown): string | null =>
  (getState() as { workspace?: { current?: { _id?: string } | null } }).workspace?.current?._id || null;

const clearTicketState = (state: TicketsState, workspaceId: string | null = null) => {
  state.workspaceId = workspaceId;
  state.tickets = [];
  state.selectedTicket = null;
  state.status = 'idle';
  state.error = null;
  state.pagination = { page: 1, limit: 50, total: 0, totalPages: 1 };
};

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (
    params: { workspaceId: string; status?: string; priority?: string; search?: string; page?: number },
    { rejectWithValue }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.status && params.status !== 'all') searchParams.append('status', params.status);
      if (params.priority && params.priority !== 'all') searchParams.append('priority', params.priority);
      if (params.search) searchParams.append('search', params.search);
      if (params.page) searchParams.append('page', params.page.toString());

      const response = await api.get(`/api/tickets?${searchParams.toString()}`, {
        headers: { 'X-Workspace-Id': params.workspaceId },
      });
      if (!response.data.success) return rejectWithValue(response.data.message || 'Failed to fetch tickets');
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to fetch issues.'));
    }
  }
);

export const createTicketThunk = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData: Partial<JiraTicket>, { rejectWithValue, getState }) => {
    try {
      const workspaceId = workspaceFromState(getState);
      if (!workspaceId) return rejectWithValue('Select a workspace before creating a ticket.');
      const response = await api.post('/api/tickets', {
        ...ticketData,
        assignee: ticketData.assignee?.id,
        reporter: ticketData.reporter?.id,
      }, { headers: { 'X-Workspace-Id': workspaceId } });
      if (!response.data.success) return rejectWithValue(response.data.message || 'Failed to create ticket');
      return { workspaceId, ticket: response.data.data as JiraTicket };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to create issue.'));
    }
  }
);

export const updateTicketThunk = createAsyncThunk(
  'tickets/updateTicket',
  async (ticketData: JiraTicket, { rejectWithValue, getState }) => {
    try {
      const workspaceId = workspaceFromState(getState);
      if (!workspaceId) return rejectWithValue('Select a workspace before updating a ticket.');
      const response = await api.put(`/api/tickets/${ticketData.id}`, {
        ...ticketData,
        assignee: ticketData.assignee?.id,
        reporter: ticketData.reporter?.id,
      }, { headers: { 'X-Workspace-Id': workspaceId } });
      if (!response.data.success) return rejectWithValue(response.data.message || 'Failed to update ticket');
      return { workspaceId, ticket: response.data.data as JiraTicket };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to update issue.'));
    }
  }
);

export const updateTicketStatusThunk = createAsyncThunk(
  'tickets/updateTicketStatus',
  async ({ ticketId, newStatus }: { ticketId: string; newStatus: TicketStatus }, { rejectWithValue, getState }) => {
    try {
      const workspaceId = workspaceFromState(getState);
      if (!workspaceId) return rejectWithValue('Select a workspace before updating a ticket.');
      const response = await api.patch(`/api/tickets/${ticketId}/status`, { status: newStatus }, {
        headers: { 'X-Workspace-Id': workspaceId },
      });
      if (!response.data.success) return rejectWithValue(response.data.message || 'Failed to update ticket status');
      return { workspaceId, ticketId, newStatus, ticket: response.data.data as JiraTicket };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to update issue status.'));
    }
  }
);

export const deleteTicketThunk = createAsyncThunk(
  'tickets/deleteTicket',
  async (ticketId: string, { rejectWithValue, getState }) => {
    try {
      const workspaceId = workspaceFromState(getState);
      if (!workspaceId) return rejectWithValue('Select a workspace before deleting a ticket.');
      const response = await api.delete(`/api/tickets/${ticketId}`, {
        headers: { 'X-Workspace-Id': workspaceId },
      });
      if (!response.data.success) return rejectWithValue(response.data.message || 'Failed to delete ticket');
      return { workspaceId, ticketId };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Failed to delete issue.'));
    }
  }
);

export const addTicketComment = createAsyncThunk(
  'tickets/addComment',
  async ({ ticketId, text }: { ticketId: string; text: string }, { rejectWithValue, getState }) => {
    try {
      const workspaceId = workspaceFromState(getState);
      if (!workspaceId) return rejectWithValue('Select a workspace before commenting on a ticket.');
      const response = await api.post(`/api/tickets/${ticketId}/comments`, { text }, {
        headers: { 'X-Workspace-Id': workspaceId },
      });
      if (!response.data.success) return rejectWithValue(response.data.message || 'Failed to add comment.');
      return { workspaceId, ticket: response.data.data as JiraTicket };
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
    moveTicketOptimistic: (state, action: PayloadAction<{ ticketId: string; newStatus: TicketStatus }>) => {
      const { ticketId, newStatus } = action.payload;
      state.tickets = state.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() } : ticket
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(switchWorkspace, (state, action) => clearTicketState(state, action.payload))
      .addCase(fetchMyWorkspace.pending, (state) => clearTicketState(state))
      .addCase(fetchTickets.pending, (state, action) => {
        if (state.workspaceId === action.meta.arg.workspaceId) state.status = 'loading';
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        if (state.workspaceId !== action.meta.arg.workspaceId) return;
        state.status = 'succeeded';
        state.tickets = Array.isArray(action.payload.data) ? action.payload.data : [];
        if (action.payload.pagination) state.pagination = action.payload.pagination;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        if (state.workspaceId !== action.meta.arg.workspaceId) return;
        state.status = 'failed';
        state.error = (action.payload as string) || 'Could not fetch tickets';
      })
      .addCase(createTicketThunk.fulfilled, (state, action) => {
        if (state.workspaceId !== action.payload.workspaceId) return;
        const ticket = action.payload.ticket;
        if (!state.tickets.some((existing) => existing.id === ticket.id)) state.tickets.unshift(ticket);
      })
      .addCase(updateTicketThunk.fulfilled, (state, action) => {
        if (state.workspaceId !== action.payload.workspaceId) return;
        const ticket = action.payload.ticket;
        state.tickets = state.tickets.map((existing) => existing.id === ticket.id ? ticket : existing);
        if (state.selectedTicket?.id === ticket.id) state.selectedTicket = ticket;
      })
      .addCase(updateTicketStatusThunk.fulfilled, (state, action) => {
        if (state.workspaceId !== action.payload.workspaceId) return;
        const { ticketId, newStatus, ticket } = action.payload;
        state.tickets = state.tickets.map((existing) =>
          existing.id === ticketId ? ticket || { ...existing, status: newStatus } : existing
        );
      })
      .addCase(deleteTicketThunk.fulfilled, (state, action) => {
        if (state.workspaceId !== action.payload.workspaceId) return;
        state.tickets = state.tickets.filter((ticket) => ticket.id !== action.payload.ticketId);
      })
      .addCase(addTicketComment.fulfilled, (state, action) => {
        if (state.workspaceId !== action.payload.workspaceId) return;
        const ticket = action.payload.ticket;
        state.tickets = state.tickets.map((existing) => existing.id === ticket.id ? ticket : existing);
        if (state.selectedTicket?.id === ticket.id) state.selectedTicket = ticket;
      })
      .addMatcher(
        (action) => [logout.type, loginUser.pending.type, registerUser.pending.type, googleLogin.pending.type].includes(action.type),
        (state) => clearTicketState(state)
      );
  },
});

export const { setSelectedTicket, moveTicketOptimistic } = ticketsSlice.actions;
export default ticketsSlice.reducer;
