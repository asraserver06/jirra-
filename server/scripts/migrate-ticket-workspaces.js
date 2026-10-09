import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(serverRoot, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env') });

const applyChanges = process.argv.includes('--apply');

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run this migration when NODE_ENV is production.');
  }
  if (applyChanges && !process.argv.includes('--confirm')) {
    throw new Error('Pass both --apply and --confirm to write changes.');
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jira-app');
  try {
    const database = mongoose.connection.db;
    if (!database) throw new Error('MongoDB connection is not ready.');

    const tickets = database.collection('tickets');
    const totalTickets = await tickets.countDocuments({});
    const alreadyScopedTickets = await tickets.countDocuments({
      workspaceId: { $exists: true, $ne: null },
    });
    const ticketCursor = tickets.aggregate([
      { $match: { $or: [{ workspaceId: { $exists: false } }, { workspaceId: null }] } },
      {
        $lookup: {
          from: 'memberships',
          let: { reporterId: '$reporter' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$reporterId'] } } },
            { $project: { workspace: 1 } },
          ],
          as: 'reporterMemberships',
        },
      },
      { $project: { _id: 1, key: 1, reporter: 1, reporterMemberships: 1 } },
    ]);

    let assignedCount = 0;
    const orphans = [];
    for await (const ticket of ticketCursor) {
      const memberships = ticket.reporterMemberships || [];
      if (memberships.length !== 1 || !memberships[0].workspace) {
        orphans.push({
          id: ticket._id.toString(),
          key: ticket.key || null,
          reporterId: ticket.reporter?.toString() || null,
          reason: memberships.length === 0
            ? 'Reporter has no workspace membership.'
            : 'Reporter belongs to multiple workspaces; the owning workspace is ambiguous.',
        });
        continue;
      }

      const workspaceId = memberships[0].workspace;
      assignedCount += 1;
      if (applyChanges) {
        await tickets.updateOne(
          { _id: ticket._id, $or: [{ workspaceId: { $exists: false } }, { workspaceId: null }] },
          { $set: { workspaceId } }
        );
      }
    }

    const sprints = database.collection('sprints');
    const totalSprints = await sprints.countDocuments({});
    const orphanSprints = await sprints
      .find({ $or: [{ workspaceId: { $exists: false } }, { workspaceId: null }] }, { projection: { _id: 1, name: 1 } })
      .toArray();

    if (applyChanges) {
      const ticketIndexes = await tickets.indexes();
      if (ticketIndexes.some((index) => index.name === 'key_1')) {
        await tickets.dropIndex('key_1');
      }
      await tickets.createIndex(
        { workspaceId: 1, key: 1 },
        {
          name: 'workspaceId_1_key_1',
          unique: true,
          partialFilterExpression: { workspaceId: { $exists: true } },
        }
      );
    }

    console.log(JSON.stringify({
      mode: applyChanges ? 'apply' : 'report-only',
      totalTickets,
      alreadyScopedTickets,
      totalSprints,
      ticketsEligibleForAssignment: assignedCount,
      ticketsAssigned: applyChanges ? assignedCount : 0,
      ticketsNeedingManualWorkspaceMapping: orphans,
      sprintsNeedingManualWorkspaceMapping: orphanSprints.map((sprint) => ({
        id: sprint._id.toString(),
        name: sprint.name || null,
        reason: 'Sprint has no creator, project, or prior workspace reference.',
      })),
      note: applyChanges
        ? 'Records listed as orphans were not modified or deleted.'
        : 'No database records were modified. Re-run with --apply --confirm after reviewing this report.',
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(`Ticket workspace migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
