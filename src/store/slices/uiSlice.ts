import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TicketPriority, TicketStatus } from '@/types/jira';

export interface UIState {
  activeTab: 'kanban' | 'list' | 'analytics';
  selectedPriorityFilter: TicketPriority | 'all' | 'high_urgent';
  selectedAssigneeId: string | null;
  searchQuery: string;
  sidebarCollapsed: boolean;
  isCreateModalOpen: boolean;
  createInitialStatus: TicketStatus;
}

const initialState: UIState = {
  activeTab: 'kanban',
  selectedPriorityFilter: 'all',
  selectedAssigneeId: null,
  searchQuery: '',
  sidebarCollapsed: false,
  isCreateModalOpen: false,
  createInitialStatus: 'todo',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'kanban' | 'list' | 'analytics'>) => {
      state.activeTab = action.payload;
    },
    setPriorityFilter: (state, action: PayloadAction<TicketPriority | 'all' | 'high_urgent'>) => {
      state.selectedPriorityFilter = action.payload;
    },
    setAssigneeFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedAssigneeId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setCreateModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateModalOpen = action.payload;
    },
    setCreateInitialStatus: (state, action: PayloadAction<TicketStatus>) => {
      state.createInitialStatus = action.payload;
    },
  },
});

export const {
  setActiveTab,
  setPriorityFilter,
  setAssigneeFilter,
  setSearchQuery,
  toggleSidebar,
  setCreateModalOpen,
  setCreateInitialStatus,
} = uiSlice.actions;

export default uiSlice.reducer;
