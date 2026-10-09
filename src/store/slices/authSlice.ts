import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types/jira';
import { api, apiErrorMessage } from '@/lib/api';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const getStoredAuth = (): { user: User | null; token: string | null } => {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const token = localStorage.getItem('jira_token');
    const userStr = localStorage.getItem('jira_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
};

const initialStored = getStoredAuth();

const initialState: AuthState = {
  user: initialStored.user,
  token: initialStored.token,
  isAuthenticated: !!initialStored.token,
  status: 'idle',
  error: null,
};

const clearStoredAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jira_token');
    localStorage.removeItem('jira_user');
  }
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/login', {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Login failed');
      }
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error connecting to API'));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    userData: {
      firstName?: string;
      lastName?: string;
      name?: string;
      email: string;
      password: string;
      confirmPassword?: string;
      workspaceName?: string;
      organizationName?: string;
      goal?: string;
      useCase?: string;
      inviteToken?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/api/auth/signup', userData);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Registration failed');
      }
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error'));
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (credential: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/google', { credential });
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Google authentication failed');
      }
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, 'Network error during Google authentication'));
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_token', action.payload.token);
        localStorage.setItem('jira_user', JSON.stringify(action.payload.user));
      }
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      clearStoredAuth();
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.status = 'loading';
      state.error = null;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      clearStoredAuth();
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_token', action.payload.accessToken);
        localStorage.setItem('jira_user', JSON.stringify(action.payload.user));
      }
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.status = 'failed';
      state.error = (action.payload as string) || 'Authentication failed';
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.status = 'loading';
      state.error = null;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      clearStoredAuth();
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_token', action.payload.accessToken);
        localStorage.setItem('jira_user', JSON.stringify(action.payload.user));
      }
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.status = 'failed';
      state.error = (action.payload as string) || 'Registration failed';
    });

    // Google Login
    builder.addCase(googleLogin.pending, (state) => {
      state.status = 'loading';
      state.error = null;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      clearStoredAuth();
    });
    builder.addCase(googleLogin.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_token', action.payload.accessToken);
        localStorage.setItem('jira_user', JSON.stringify(action.payload.user));
      }
    });
    builder.addCase(googleLogin.rejected, (state, action) => {
      state.status = 'failed';
      state.error = (action.payload as string) || 'Google authentication failed';
    });
  },
});

export const { setCredentials, updateAccessToken, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
