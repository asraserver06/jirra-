"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateTicketThunk, deleteTicketThunk } from '@/store/slices/ticketsSlice';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MOCK_USERS } from '@/data/mockData';
import { JiraTicket, TicketPriority, TicketStatus, TicketType } from '@/types/jira';
import {
  ChevronRight,
  ArrowLeft,
  Trash2,
  Save,
  MessageSquare,
  Send,
  Calendar,
  Clock,
  User as UserIcon,
  Bookmark,
  Bug,
  CheckSquare,
  Zap,
} from 'lucide-react';

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { tickets } = useAppSelector((state) => state.tickets);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const ticket = tickets.find((t) => t.id === id || t.key === id);

  const [title, setTitle] = useState(ticket?.title || '');
  const [description, setDescription] = useState(ticket?.description || '');
  const [status, setStatus] = useState<TicketStatus>(ticket?.status || 'todo');
  const [priority, setPriority] = useState<TicketPriority>(ticket?.priority || 'medium');
  const [type, setType] = useState<TicketType>(ticket?.type || 'story');
  const [storyPoints, setStoryPoints] = useState<number>(ticket?.storyPoints || 3);
  const [assigneeId, setAssigneeId] = useState<string>(ticket?.assignee?.id || (ticket?.assignee as any)?._id || 'usr-1');

  // Comments local state
  const [comments, setComments] = useState<any[]>(() => {
    return (ticket as any)?.comments || [
      {
        id: 'c-1',
        user: { name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
        text: 'Initial review complete. Please update the PR with error handling test cases.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];
  });
  const [newCommentText, setNewCommentText] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title);
      setDescription(ticket.description);
      setStatus(ticket.status);
      setPriority(ticket.priority);
      setType(ticket.type);
      setStoryPoints(ticket.storyPoints);
      setAssigneeId(ticket.assignee?.id || (ticket.assignee as any)?._id || 'usr-1');
    }
  }, [ticket]);

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-bold text-foreground">Ticket Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          The requested ticket #{id} could not be located.
        </p>
        <Link href="/board">
          <Button variant="jira">Return to Board</Button>
        </Link>
      </div>
    );
  }

  const handleSaveChanges = async () => {
    const assignedUser = MOCK_USERS.find((u) => u.id === assigneeId) || ticket.assignee;
    const updated: JiraTicket = {
      ...ticket,
      title,
      description,
      status,
      priority,
      type,
      storyPoints,
      assignee: assignedUser,
      updatedAt: new Date().toISOString(),
    };

    await dispatch(updateTicketThunk(updated));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${ticket.key}?`)) {
      await dispatch(deleteTicketThunk(ticket.id));
      router.push('/board');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      user: {
        name: currentUser?.name || 'Current User',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  const getTypeIcon = (t: TicketType) => {
    switch (t) {
      case 'bug': return <Bug className="w-4 h-4 text-red-500" />;
      case 'story': return <Bookmark className="w-4 h-4 text-emerald-500" />;
      case 'epic': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'task': default: return <CheckSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Link href="/board" className="flex items-center gap-1 text-[#0052CC] dark:text-blue-400 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Board
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Projects</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Acme Software</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-bold text-foreground font-mono">{ticket.key}</span>
        </div>

        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              Changes Saved!
            </span>
          )}
          <Button onClick={handleSaveChanges} variant="jira" size="sm" className="gap-1.5 text-xs">
            <Save className="w-3.5 h-3.5" /> Save Changes
          </Button>
          <Button onClick={handleDelete} variant="destructive" size="sm" className="gap-1.5 text-xs">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Issue Title, Description, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Header */}
          <div className="bg-card border border-border rounded-lg p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              {getTypeIcon(type)}
              <span className="font-bold text-sm text-muted-foreground font-mono">{ticket.key}</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="text-xs bg-muted border border-input rounded px-2 py-0.5"
              >
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="task">Task</option>
                <option value="epic">Epic</option>
              </select>
            </div>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title..."
              className="text-lg font-bold h-10"
            />
          </div>

          {/* Description Section with RichTextEditor */}
          <div className="bg-card border border-border rounded-lg p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Description
            </h3>
            <RichTextEditor
              value={description}
              onChange={setDescription}
            />
          </div>

          {/* Activity / Comments Section */}
          <div className="bg-card border border-border rounded-lg p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Discussion & Activity
            </h3>

            {/* Comment Box */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a comment to this issue..."
                className="text-xs"
              />
              <Button type="submit" variant="jira" size="sm" className="gap-1 shrink-0 text-xs">
                <Send className="w-3.5 h-3.5" /> Post
              </Button>
            </form>

            {/* Comment Stream */}
            <div className="space-y-3 pt-2">
              {comments.map((c) => (
                <div key={c.id} className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.user?.avatar} alt={c.user?.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{c.user?.name}</span>
                    </div>
                    <span className="text-[10px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-foreground/90 pl-6 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Status, Details Sidebar Panel */}
        <div className="space-y-4">
          {/* Status Box */}
          <div className="bg-card border border-border rounded-lg p-4 shadow-2xs space-y-3">
            <label className="text-[11px] font-bold uppercase text-muted-foreground block">
              Issue Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs font-bold text-foreground focus-visible:outline-none"
            >
              <option value="todo" className="dark:bg-slate-900">TO DO</option>
              <option value="in_progress" className="dark:bg-slate-900">IN PROGRESS</option>
              <option value="in_review" className="dark:bg-slate-900">IN REVIEW</option>
              <option value="done" className="dark:bg-slate-900">DONE</option>
            </select>
          </div>

          {/* Details Panel */}
          <div className="bg-card border border-border rounded-lg p-4 shadow-2xs space-y-4 text-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Issue Details
            </h4>

            {/* Assignee */}
            <div>
              <span className="text-muted-foreground font-semibold block mb-1">Assignee</span>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
              >
                {MOCK_USERS.map((u) => (
                  <option key={u.id} value={u.id} className="dark:bg-slate-900">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Reporter */}
            <div>
              <span className="text-muted-foreground font-semibold block mb-1">Reporter</span>
              <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50 border border-border">
                {ticket.reporter && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ticket.reporter.avatar} alt={ticket.reporter.name} className="w-5 h-5 rounded-full object-cover" />
                )}
                <span className="font-medium text-foreground truncate">{ticket.reporter?.name || 'Alex Morgan'}</span>
              </div>
            </div>

            {/* Priority */}
            <div>
              <span className="text-muted-foreground font-semibold block mb-1">Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-8 rounded border border-input bg-transparent px-2 text-xs"
              >
                <option value="urgent" className="dark:bg-slate-900">Urgent</option>
                <option value="high" className="dark:bg-slate-900">High</option>
                <option value="medium" className="dark:bg-slate-900">Medium</option>
                <option value="low" className="dark:bg-slate-900">Low</option>
              </select>
            </div>

            {/* Story Points */}
            <div>
              <span className="text-muted-foreground font-semibold block mb-1">Story Points</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={storyPoints}
                onChange={(e) => setStoryPoints(parseInt(e.target.value, 10) || 0)}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Timestamps */}
            <div className="pt-2 border-t border-border space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {new Date(ticket.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
