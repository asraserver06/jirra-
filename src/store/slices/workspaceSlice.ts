import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, apiErrorMessage } from '@/lib/api';
import { googleLogin, loginUser, logout, registerUser } from './authSlice';

export interface Workspace {
  _id: string;
  name: string;
  slug?: string;
  createdAt?: string;
  role?: 'admin' | 'member';
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
  workspaces: Workspace[];
  current: Workspace | null;
  myRole: 'admin' | 'member' | null;
  members: WorkspaceMember[];
  pendingInvites: PendingInvite[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  membersStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  invitesStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const storedWorkspaceId = () =>
  typeof window === 'undefined' ? null : localStorage.getItem('jira_workspace_id');

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
    workspaces: [],
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
    switchWorkspace: (state, action: PayloadAction<string>) => {
      const nextWorkspace = state.workspaces.find((workspace) => workspace._id === action.payload);
      if (!nextWorkspace || state.current?._id === nextWorkspace._id) return;
      state.current = nextWorkspace;
      state.myRole = nextWorkspace.role || null;
      state.members = [];
      state.pendingInvites = [];
      state.membersStatus = 'idle';
      state.invitesStatus = 'idle';
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_workspace_id', nextWorkspace._id);
      }
    },
    clearWorkspace: (state) => {
      state.workspaces = [];
      state.current = null;
      state.myRole = null;
      state.members = [];
      state.pendingInvites = [];
      state.status = 'idle';
      if (typeof window !== 'undefined') localStorage.removeItem('jira_workspace_id');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyWorkspace.pending, (state) => {
        state.current = null;
        state.myRole = null;
        state.members = [];
        state.pendingInvites = [];
        state.membersStatus = 'idle';
        state.invitesStatus = 'idle';
        state.status = 'loading';
      })
      .addCase(fetchMyWorkspace.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.workspaces = action.payload;
        const selectedId = storedWorkspaceId();
        const selected = action.payload.find((workspace) => workspace._id === selectedId) || action.payload[0];
        state.current = selected || null;
        state.myRole = selected?.role || null;
        if (typeof window !== 'undefined') {
          if (selected) localStorage.setItem('jira_workspace_id', selected._id);
          else localStorage.removeItem('jira_workspace_id');
        }
      })
      .addCase(fetchMyWorkspace.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        state.workspaces = [];
        state.current = null;
        state.myRole = null;
        state.members = [];
        state.pendingInvites = [];
        if (typeof window !== 'undefined') localStorage.removeItem('jira_workspace_id');
      })
      // fetchMembers
      .addCase(fetchMembers.pending, (state, action) => {
        if (action.meta.arg === state.current?._id) state.membersStatus = 'loading';
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        if (action.meta.arg !== state.current?._id) return;
        state.membersStatus = 'succeeded';
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        if (action.meta.arg === state.current?._id) state.membersStatus = 'failed';
      })
      // fetchPendingInvites
      .addCase(fetchPendingInvites.pending, (state, action) => {
        if (action.meta.arg === state.current?._id) state.invitesStatus = 'loading';
      })
      .addCase(fetchPendingInvites.fulfilled, (state, action) => {
        if (action.meta.arg !== state.current?._id) return;
        state.invitesStatus = 'succeeded';
        state.pendingInvites = action.payload;
      })
      .addCase(fetchPendingInvites.rejected, (state, action) => {
        if (action.meta.arg === state.current?._id) state.invitesStatus = 'failed';
      })
      // removeMember
      .addCase(removeMember.fulfilled, (state, action) => {
        if (state.current?._id !== action.meta.arg.workspaceId) return;
        state.members = state.members.filter(m => m.user._id !== action.payload);
      })
      // revokeInvite
      .addCase(revokeInvite.fulfilled, (state, action) => {
        if (state.current?._id !== action.meta.arg.workspaceId) return;
        state.pendingInvites = state.pendingInvites.filter(i => i._id !== action.payload);
      })
      // sendInvites → refresh pending
      .addCase(sendInvites.fulfilled, (state, action) => {
        if (state.current?._id !== action.meta.arg.workspaceId) return;
        // invites will be refetched after
        state.invitesStatus = 'idle';
      })
      .addMatcher(
        (action) => [logout.type, loginUser.pending.type, registerUser.pending.type, googleLogin.pending.type].includes(action.type),
        (state) => {
          state.workspaces = [];
          state.current = null;
          state.myRole = null;
          state.members = [];
          state.pendingInvites = [];
          state.status = 'idle';
          state.membersStatus = 'idle';
          state.invitesStatus = 'idle';
          state.error = null;
        }
      );
  },
});

export const { clearWorkspace, switchWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
