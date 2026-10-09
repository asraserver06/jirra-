import fs from 'fs';
import path from 'path';

const files = [
  'src/components/TicketModal.tsx',
  'src/components/PriorityFilter.tsx',
  'src/components/Board.tsx',
  'src/app/(app)/layout.tsx',
  'src/app/(app)/tickets/[id]/page.tsx',
  'src/app/(app)/dashboard/page.tsx',
  'src/app/api/tickets/route.ts'
];

for (const file of files) {
  const p = path.resolve(process.cwd(), file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/import \{.*\} from '..\/data\/mockData';/g, '');
    content = content.replace(/import \{.*\} from '@\/data\/mockData';/g, '');
    content = content.replace(/MOCK_USERS/g, '[]');
    content = content.replace(/COLUMNS/g, '[]');
    content = content.replace(/INITIAL_TICKETS/g, '[]');
    fs.writeFileSync(p, content);
    console.log('Patched', file);
  }
}
