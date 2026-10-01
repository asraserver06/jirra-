import { NextResponse } from 'next/server';
import { INITIAL_TICKETS } from '@/data/mockData';
import { JiraTicket } from '@/types/jira';

let inMemoryTickets: JiraTicket[] = [...INITIAL_TICKETS];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let filtered = [...inMemoryTickets];

  if (status && status !== 'all') {
    filtered = filtered.filter((t) => t.status === status);
  }

  if (priority && priority !== 'all') {
    if (priority === 'high_urgent') {
      filtered = filtered.filter((t) => t.priority === 'high' || t.priority === 'urgent');
    } else {
      filtered = filtered.filter((t) => t.priority === priority);
    }
  }

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.key.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s)
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    success: true,
    message: 'Tickets retrieved successfully',
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newTicket: JiraTicket = {
      id: `t-${Date.now()}`,
      key: `PROJ-${Math.floor(100 + Math.random() * 900)}`,
      title: body.title || 'Untitled Ticket',
      description: body.description || '',
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      type: body.type || 'story',
      storyPoints: body.storyPoints || 3,
      assignee: body.assignee || inMemoryTickets[0].assignee,
      reporter: body.reporter || inMemoryTickets[0].reporter,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryTickets.unshift(newTicket);

    return NextResponse.json({
      success: true,
      message: 'Ticket created successfully',
      data: newTicket,
    }, { status: 201 });
  } catch {
    return NextResponse.json({
      success: false,
      message: 'Failed to parse request payload',
    }, { status: 400 });
  }
}
