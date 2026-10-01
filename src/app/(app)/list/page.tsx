"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteTicketThunk, updateTicketStatusThunk } from '@/store/slices/ticketsSlice';
import { setCreateModalOpen } from '@/store/slices/uiSlice';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Bookmark,
  Bug,
  CheckSquare,
  Zap,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { JiraTicket, TicketPriority, TicketStatus, TicketType } from '@/types/jira';

export default function IssueListPage() {
  const dispatch = useAppDispatch();
  const { tickets } = useAppSelector((state) => state.tickets);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'key' | 'title' | 'priority' | 'status' | 'storyPoints'>('key');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const getTypeIcon = (type: TicketType) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-3.5 h-3.5 text-red-500" />;
      case 'story':
        return <Bookmark className="w-3.5 h-3.5 text-emerald-500" />;
      case 'epic':
        return <Zap className="w-3.5 h-3.5 text-purple-500" />;
      case 'task':
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'done':
        return <Badge variant="low" className="uppercase font-mono text-[10px]">DONE</Badge>;
      case 'in_progress':
        return <Badge variant="task" className="uppercase font-mono text-[10px]">IN PROGRESS</Badge>;
      case 'in_review':
        return <Badge variant="medium" className="uppercase font-mono text-[10px]">IN REVIEW</Badge>;
      case 'todo':
      default:
        return <Badge variant="secondary" className="uppercase font-mono text-[10px]">TO DO</Badge>;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="urgent">Urgent</Badge>;
      case 'high':
        return <Badge variant="high">High</Badge>;
      case 'medium':
        return <Badge variant="medium">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="low">Low</Badge>;
    }
  };

  // Filter and sort tickets
  const filtered = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.key.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'key') comp = a.key.localeCompare(b.key);
    else if (sortBy === 'title') comp = a.title.localeCompare(b.title);
    else if (sortBy === 'priority') comp = a.priority.localeCompare(b.priority);
    else if (sortBy === 'status') comp = a.status.localeCompare(b.status);
    else if (sortBy === 'storyPoints') comp = (a.storyPoints || 0) - (b.storyPoints || 0);

    return sortOrder === 'asc' ? comp : -comp;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginatedTickets = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 font-medium">
        <span>Projects</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0052CC] dark:text-blue-400 font-semibold">Acme Software</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-bold">All Issues</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-amber-500" />
            Issues List
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full backlog and sprint issues with column sorting and filtering
          </p>
        </div>

        <Button
          onClick={() => dispatch(setCreateModalOpen(true))}
          variant="jira"
          size="sm"
          className="text-xs font-bold gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create issue
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card border border-border rounded-lg mb-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by keyword..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground focus-visible:outline-none"
          >
            <option value="all" className="dark:bg-slate-900">All Statuses</option>
            <option value="todo" className="dark:bg-slate-900">To Do</option>
            <option value="in_progress" className="dark:bg-slate-900">In Progress</option>
            <option value="in_review" className="dark:bg-slate-900">In Review</option>
            <option value="done" className="dark:bg-slate-900">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground focus-visible:outline-none"
          >
            <option value="all" className="dark:bg-slate-900">All Priorities</option>
            <option value="urgent" className="dark:bg-slate-900">Urgent</option>
            <option value="high" className="dark:bg-slate-900">High</option>
            <option value="medium" className="dark:bg-slate-900">Medium</option>
            <option value="low" className="dark:bg-slate-900">Low</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          Showing {paginatedTickets.length} of {sorted.length} issues
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Type</TableHead>
              <TableHead
                onClick={() => toggleSort('key')}
                className="w-24 cursor-pointer hover:text-foreground select-none"
              >
                <div className="flex items-center gap-1">
                  Key <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort('title')}
                className="cursor-pointer hover:text-foreground select-none"
              >
                <div className="flex items-center gap-1">
                  Summary <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort('status')}
                className="w-32 cursor-pointer hover:text-foreground select-none"
              >
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort('priority')}
                className="w-28 cursor-pointer hover:text-foreground select-none"
              >
                <div className="flex items-center gap-1">
                  Priority <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort('storyPoints')}
                className="w-20 cursor-pointer hover:text-foreground select-none text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  Points <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="w-40">Assignee</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedTickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-muted/50 transition">
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    {getTypeIcon(ticket.type)}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#0052CC] dark:text-blue-400 font-mono">
                  <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                    {ticket.key}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="text-xs font-semibold text-foreground hover:text-[#0052CC] dark:hover:text-blue-400 line-clamp-1"
                  >
                    {ticket.title}
                  </Link>
                </TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                <TableCell className="text-center font-mono font-bold text-xs">
                  {ticket.storyPoints}
                </TableCell>
                <TableCell>
                  {ticket.assignee && (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ticket.assignee.avatar}
                        alt={ticket.assignee.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs text-foreground truncate max-w-[120px]">
                        {ticket.assignee.name}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/tickets/${ticket.id}`} className="flex items-center gap-2">
                          <ExternalLink className="w-3.5 h-3.5" /> View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm(`Delete issue ${ticket.key}?`)) {
                            dispatch(deleteTicketThunk(ticket.id));
                          }
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {paginatedTickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                  No issues found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
