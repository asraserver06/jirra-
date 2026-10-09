"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchMembers } from '@/store/slices/workspaceSlice';
import { setCreateModalOpen } from '@/store/slices/uiSlice';
import {
  BarChart2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  Flame,
  ChevronRight,
  ExternalLink,
  Plus,
} from 'lucide-react';


export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { tickets, status, error } = useAppSelector((state) => state.tickets);
  const { current: workspace, members, membersStatus } = useAppSelector((state) => state.workspace);

  useEffect(() => {
    if (workspace?._id) dispatch(fetchMembers(workspace._id));
  }, [dispatch, workspace?._id]);

  const total = tickets.length;
  const done = tickets.filter((t) => t.status === 'done').length;
  const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
  const inReview = tickets.filter((t) => t.status === 'in_review').length;
  const todo = tickets.filter((t) => t.status === 'todo').length;

  const totalPoints = tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const donePoints = tickets
    .filter((t) => t.status === 'done')
    .reduce((acc, t) => acc + (t.storyPoints || 0), 0);

  const urgentCount = tickets.filter((t) => t.priority === 'urgent').length;
  const highCount = tickets.filter((t) => t.priority === 'high').length;

  const percentComplete = total > 0 ? Math.round((done / total) * 100) : 0;
  const pointsPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  if (status === 'idle' || status === 'loading') {
    return <p className="p-8 text-center text-sm text-muted-foreground">Loading workspace issues…</p>;
  }

  if (status === 'failed') {
    return <p role="alert" className="p-8 text-center text-sm text-destructive">{error || 'Unable to load workspace issues.'}</p>;
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col max-w-4xl mx-auto w-full pb-16 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">{workspace?.name || 'Workspace'} dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your workspace is ready. Create an issue to start tracking work.</p>
        </div>
        <Card className="py-12 text-center">
          <CardContent className="flex flex-col items-center gap-3">
            <BarChart2 className="w-8 h-8 text-muted-foreground" />
            <h2 className="text-lg font-bold">No issues yet</h2>
            <p className="text-sm text-muted-foreground">Issues and dashboard metrics will appear here when your team creates work.</p>
            <Button onClick={() => dispatch(setCreateModalOpen(true))} className="mt-2">
              <Plus className="w-4 h-4 mr-1" /> Create first issue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full pb-16 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <span>Projects</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0052CC] dark:text-blue-400 font-semibold">{workspace?.name || 'Workspace'}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-bold">Dashboard</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            Workspace analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Issue completion, progress, and team workload
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/board">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              Kanban Board <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
          <Link href="/list">
            <Button variant="jira" size="sm" className="text-xs gap-1.5">
              All Issues <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Issue Completion */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Issue Completion
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              {percentComplete}%
              <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {done} of {total} issues completed
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Story Points Delivered */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Story Points Delivered
            </CardDescription>
            <CardTitle className="text-2xl font-black text-[#0052CC] dark:text-blue-400 flex items-center justify-between">
              {donePoints} / {totalPoints}
              <TrendingUp className="w-6 h-6 text-blue-500 opacity-80" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {pointsPercent}% of story points delivered
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#0052CC] dark:bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${pointsPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: In Progress WIP */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Work In Progress (WIP)
            </CardDescription>
            <CardTitle className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-between">
              {inProgress + inReview}
              <Clock className="w-6 h-6 text-amber-500 opacity-80" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {inProgress} active coding, {inReview} in review
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${total > 0 ? ((inProgress + inReview) / total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Urgent / High Blockers */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Urgent & High Issues
            </CardDescription>
            <CardTitle className="text-2xl font-black text-red-600 dark:text-red-400 flex items-center justify-between">
              {urgentCount + highCount}
              <Flame className="w-6 h-6 text-red-500 opacity-80" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {urgentCount} urgent, {highCount} high priority
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${total > 0 ? ((urgentCount + highCount) / total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Status Breakdown + Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Issue Status Distribution</CardTitle>
            <CardDescription className="text-xs">
              Live count of tickets across Kanban pipeline columns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Done */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Done
                </span>
                <span>{done} issues ({total > 0 ? Math.round((done / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* In Review */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Review
                </span>
                <span>{inReview} issues ({total > 0 ? Math.round((inReview / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${total > 0 ? (inReview / total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* In Progress */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> In Progress
                </span>
                <span>{inProgress} issues ({total > 0 ? Math.round((inProgress / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* To Do */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> To Do
                </span>
                <span>{todo} issues ({total > 0 ? Math.round((todo / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full" style={{ width: `${total > 0 ? (todo / total) * 100 : 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Workload Allocation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Team Workload & Story Points
            </CardTitle>
            <CardDescription className="text-xs">
              Work assigned across workspace members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {membersStatus === 'loading' ? (
              <p className="text-xs text-muted-foreground">Loading workspace members…</p>
            ) : membersStatus === 'failed' ? (
              <p role="alert" className="text-xs text-destructive">Unable to load workspace members.</p>
            ) : members.length === 0 ? (
              <p className="text-xs text-muted-foreground">No workspace members found.</p>
            ) : members.map((membership) => {
              const member = membership.user;
              const memberId = member.id || member._id;
              const memberTickets = tickets.filter(
                (t) => t.assignee?.id === memberId || t.assignee?._id === memberId
              );
              const memberPoints = memberTickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
              const memberDone = memberTickets.filter((t) => t.status === 'done').length;

              return (
                <div
                  key={membership._id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
                    ) : (
                      <div aria-hidden="true" className="w-8 h-8 rounded-full border border-border bg-muted flex items-center justify-center font-semibold">
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-xs text-foreground">{member.name}</div>
                      <div className="text-[10px] text-muted-foreground">{membership.role}</div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-bold text-foreground">
                      {memberTickets.length} issues <span className="font-mono text-[11px] text-muted-foreground">({memberPoints} pts)</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {memberDone} completed
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
