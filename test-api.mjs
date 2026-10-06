import fs from 'fs';

async function runTests() {
  console.log('--- Starting API Integration Tests ---');
  const API_URL = 'http://localhost:5000/api';
  
  let accessToken = '';
  let ticketId = '';
  const testEmail = `testuser_${Date.now()}@test.com`;

  let userId = '';

  try {
    // 1. Register User
    console.log(`\n1. Registering user: ${testEmail}`);
    let res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        password: 'password123',
        role: 'developer'
      })
    });
    let data = await res.json();
    if (!res.ok) throw new Error(`Register failed: ${data.message}`);
    accessToken = data.data.accessToken;
    userId = data.data.user.id || data.data.user._id;
    console.log('✅ Registration successful');

    // 2. Get Me (Auth Check)
    console.log('\n2. Fetching profile (GET /api/auth/me)');
    res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    data = await res.json();
    if (!res.ok) throw new Error(`Get Me failed: ${data.message}`);
    console.log('✅ Authentication works. Logged in as:', data.data.email);

    // 3. Get Tickets
    console.log('\n3. Fetching board tickets (GET /api/tickets)');
    res = await fetch(`${API_URL}/tickets`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    data = await res.json();
    if (!res.ok) throw new Error(`Get tickets failed: ${data.message}`);
    console.log(`✅ Board fetched successfully. Initial tickets: ${data.data.length}`);

    // 4. Create Ticket
    console.log('\n4. Creating a new ticket');
    // Use userId from registration
    const assigneeId = userId;
    
    res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        title: 'Test Integration Ticket',
        description: 'Testing the backend APIs',
        status: 'todo',
        priority: 'high',
        storyPoints: 5,
        assignee: assigneeId
      })
    });
    data = await res.json();
    if (!res.ok) throw new Error(`Create ticket failed: ${data.message} ${JSON.stringify(data.errors || data)}`);
    ticketId = data.data.id || data.data._id;
    console.log(`✅ Ticket created with ID: ${ticketId}`);

    // 5. Update Ticket Status
    console.log(`\n5. Updating ticket status to 'in_progress'`);
    res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ status: 'in_progress' })
    });
    data = await res.json();
    if (!res.ok) throw new Error(`Update status failed: ${data.message}`);
    console.log('✅ Ticket status updated to:', data.data.status);

    // 6. Delete Ticket
    console.log(`\n6. Deleting the ticket`);
    res = await fetch(`${API_URL}/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    data = await res.json();
    if (!res.ok) throw new Error(`Delete ticket failed: ${data.message}`);
    console.log('✅ Ticket deleted successfully');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
