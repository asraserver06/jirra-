import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, apiErrorMessage } from '@/lib/api';
import { logout } from './authSlice';

export interface Workspace {
  _id: string;
  name: string;
  slug?: string;
  createdAt?: string;
}

export interface WorkspaceMember {
  _id: string;
  user: {
    id: string;
    _id?: string;
    name: string;
    email: string;
    avatar: string;
  };
  role: 'admin' | 'member';
  createdAt: string;
}

export interface PendingInvite {
  _id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending';
  expiresAt: string;
  createdAt: string;
  invitedBy?: { name: string; email: string; avatar: string };
}

export interface WorkspaceState {
  current: Workspace | null;
  myRole: 'admin' | 'member' | null;
  members: WorkspaceMember[];
  pendingInvites: PendingInvite[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  membersStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  invitesStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Fetch the current user's workspaces and pick the first one
export const fetchMyWorkspace = createAsyncThunk(
  'workspace/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/workspaces/me');
      const data = response.data;
      if (!data.success) {
        return rejectWithValue(data.message || 'Failed to fetch workspace');
      }
      return data.data as (Workspace & { role: 'admin' | 'member' })[];
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error'));
    }
  }
);

export const fetchMembers = createAsyncThunk(
  'workspace/fetchMembers',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/workspaces/${workspaceId}/members`);
      const data = response.data;
      if (!data.success) return rejectWithValue(data.message || 'Failed to fetch members');
      return data.data as WorkspaceMember[];
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error'));
    }
  }
);

export const fetchPendingInvites = createAsyncThunk(
  'workspace/fetchInvites',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/workspaces/${workspaceId}/invites`);
      const data = response.data;
      if (!data.success) return rejectWithValue(data.message || 'Failed to fetch invites');
      return data.data as PendingInvite[];
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error'));
    }
  }
);

export const sendInvites = createAsyncThunk(
  'workspace/sendInvites',
  async ({ workspaceId, emails, role }: { workspaceId: string; emails: string[]; role: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/workspaces/${workspaceId}/invites`, { emails, role });
      const data = response.data;
      if (!data.success) return rejectWithValue(data.message || 'Failed to send invites');
      return data.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error'));
    }
  }
);

export const removeMember = createAsyncThunk(
  'workspace/removeMember',
  async ({ workspaceId, userId }: { workspaceId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
      const data = response.data;
      if (!data.success) return rejectWithValue(data.message || 'Failed to remove member');
      return userId;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error'));
    }
  }
);

export const revokeInvite = createAsyncThunk(
  'workspace/revokeInvite',
  async ({ workspaceId, inviteId }: { workspaceId: string; inviteId: string }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/workspaces/${workspaceId}/invites/${inviteId}`);
      const data = response.data;
      if (!data.success) return rejectWithValue(data.message || 'Failed to revoke invite');
      return inviteId;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error'));
    }
  }
);

export const resendInvite = createAsyncThunk(
  'workspace/resendInvite',
  async ({ workspaceId, inviteId }: { workspaceId: string; inviteId: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/workspaces/${workspaceId}/invites/${inviteId}/resend`);
      const data = response.data;
      if (!data.success) return rejectWithValue(data.message || 'Failed to resend invite');
      return inviteId;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error'));
    }
  }
);

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: {
    current: null,
    myRole: null,
    members: [],
    pendingInvites: [],
    status: 'idle',
    membersStatus: 'idle',
    invitesStatus: 'idle',
    error: null,
  } as WorkspaceState,
  reducers: {
    clearWorkspace: (state) => {
      state.current = null;
      state.myRole = null;
      state.members = [];
      state.pendingInvites = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => {
        state.current = null;
        state.myRole = null;
        state.members = [];
        state.pendingInvites = [];
        state.status = 'idle';
        state.membersStatus = 'idle';
        state.invitesStatus = 'idle';
        state.error = null;
      })
      // fetchMyWorkspace
      .addCase(fetchMyWorkspace.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyWorkspace.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const workspaces = action.payload;
        if (workspaces.length > 0) {
          const ws = workspaces[0];
          state.current = { _id: ws._id, name: ws.name, slug: ws.slug, createdAt: ws.createdAt };
          state.myRole = ws.role;
        }
      })
      .addCase(fetchMyWorkspace.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // fetchMembers
      .addCase(fetchMembers.pending, (state) => { state.membersStatus = 'loading'; })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.membersStatus = 'succeeded';
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state) => { state.membersStatus = 'failed'; })
      // fetchPendingInvites
      .addCase(fetchPendingInvites.pending, (state) => { state.invitesStatus = 'loading'; })
      .addCase(fetchPendingInvites.fulfilled, (state, action) => {
        state.invitesStatus = 'succeeded';
        state.pendingInvites = action.payload;
      })
      .addCase(fetchPendingInvites.rejected, (state) => { state.invitesStatus = 'failed'; })
      // removeMember
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter(m => m.user._id !== action.payload);
      })
      // revokeInvite
      .addCase(revokeInvite.fulfilled, (state, action) => {
        state.pendingInvites = state.pendingInvites.filter(i => i._id !== action.payload);
      })
      // sendInvites → refresh pending
      .addCase(sendInvites.fulfilled, (state) => {
        // invites will be refetched after
        state.invitesStatus = 'idle';
      });
  },
});

export const { clearWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
