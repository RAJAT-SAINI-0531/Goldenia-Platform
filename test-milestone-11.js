// Simple test script to verify Milestone 11 functionality
// Run this with: node test-milestone-11.js

const baseUrl = 'http://localhost:4000';

console.log('===================================');
console.log('MILESTONE 11 - LANDING PAGE TEST');
console.log('===================================\n');

// Test 1: Health Check
console.log('Test 1: API Health Check...');
fetch(`${baseUrl}/api/v1/health`)
  .then(res => res.json())
  .then(data => {
    if (data.status === 'ok') {
      console.log('✓ API is running\n');
      
      // Test 2: Add to Waitlist
      console.log('Test 2: Adding email to waitlist...');
      const testEmail = `test${Date.now()}@example.com`;
      
      return fetch(`${baseUrl}/api/v1/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          name: 'Test User'
        })
      });
    } else {
      throw new Error('API health check failed');
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✓ Email added successfully');
      console.log(`  Email: ${data.data.email}`);
      console.log(`  Name: ${data.data.name}\n`);
      
      // Test 3: Try duplicate email
      console.log('Test 3: Testing duplicate email prevention...');
      return fetch(`${baseUrl}/api/v1/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.data.email,
          name: 'Another User'
        })
      });
    } else {
      throw new Error('Failed to add email');
    }
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success && data.message.includes('already on the waitlist')) {
      console.log('✓ Duplicate prevention working\n');
      
      console.log('===================================');
      console.log('ALL TESTS PASSED!');
      console.log('===================================\n');
      console.log('What you should see on the landing page:');
      console.log('1. Dark theme with yellow accents');
      console.log('2. Hero section with waitlist form');
      console.log('3. "How It Works" section (3 steps)');
      console.log('4. "Why Goldenia?" features (4 cards)');
      console.log('5. Footer with links\n');
      console.log('Visit: http://localhost:3001');
    } else {
      throw new Error('Duplicate prevention not working');
    }
  })
  .catch(error => {
    console.error('✗ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Database is running: docker-compose up -d');
    console.log('2. API server is running: npm run dev (in apps/api)');
    console.log('3. Web server is running: npm run dev (in apps/web)');
  });
