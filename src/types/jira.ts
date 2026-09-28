export type TicketStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TicketType = 'bug' | 'story' | 'task' | 'epic';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface JiraTicket {
  id: string;
  key: string;
  title: string;
  description: string; // HTML formatted string
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  assignee: User;
  reporter: User;
  storyPoints: number;
  fontFamily?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: User | null;
  status: 'authenticated' | 'loading' | 'unauthenticated';
}

export interface ColumnDefinition {
  id: TicketStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}
