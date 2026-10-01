import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket.js';
import { sendSuccess } from '../utils/response.js';

export const getSprintMetrics = async (req: Request, res: Response) => {
  const tickets = await Ticket.find().populate('assignee', 'name email avatar role');

  const total = tickets.length;
  const statusCounts = {
    todo: tickets.filter((t) => t.status === 'todo').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    in_review: tickets.filter((t) => t.status === 'in_review').length,
    done: tickets.filter((t) => t.status === 'done').length,
  };

  const priorityCounts = {
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
    high: tickets.filter((t) => t.priority === 'high').length,
    medium: tickets.filter((t) => t.priority === 'medium').length,
    low: tickets.filter((t) => t.priority === 'low').length,
  };

  const totalStoryPoints = tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const doneStoryPoints = tickets
    .filter((t) => t.status === 'done')
    .reduce((acc, t) => acc + (t.storyPoints || 0), 0);

  const completionPercentage = total > 0 ? Math.round((statusCounts.done / total) * 100) : 0;
  const pointsPercentage = totalStoryPoints > 0 ? Math.round((doneStoryPoints / totalStoryPoints) * 100) : 0;

  // Workload per team member
  const assigneeWorkload: Record<string, { user: any; count: number; storyPoints: number }> = {};
  for (const t of tickets) {
    if (t.assignee) {
      const uId = t.assignee._id ? t.assignee._id.toString() : 'unknown';
      if (!assigneeWorkload[uId]) {
        assigneeWorkload[uId] = {
          user: t.assignee,
          count: 0,
          storyPoints: 0,
        };
      }
      assigneeWorkload[uId].count += 1;
      assigneeWorkload[uId].storyPoints += (t.storyPoints || 0);
    }
  }

  return sendSuccess(
    res,
    {
      sprintName: 'Sprint 14 - Platform Architecture & Polish',
      totalTickets: total,
      statusCounts,
      priorityCounts,
      totalStoryPoints,
      doneStoryPoints,
      completionPercentage,
      pointsPercentage,
      assigneeWorkload: Object.values(assigneeWorkload),
    },
    'Sprint metrics retrieved successfully'
  );
};
