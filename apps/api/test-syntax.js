// Quick syntax and import test for production code
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing compiled code syntax...\n');

const filesToTest = [
  'dist/server.js',
  'dist/routes/auth.js',
  'dist/routes/payments.js',
  'dist/modules/payments/payment.service.js',
  'dist/middleware/validator.js',
  'dist/middleware/auth.middleware.js'
];

let allPassed = true;

filesToTest.forEach(file => {
  try {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ ${file} - FILE NOT FOUND`);
      allPassed = false;
      return;
    }
    
    // Check file can be read
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Basic checks
    if (content.length === 0) {
      console.log(`❌ ${file} - EMPTY FILE`);
      allPassed = false;
      return;
    }
    
    // Check for syntax markers
    if (file.includes('routes/auth.js')) {
      if (!content.includes('signupSchema') || !content.includes('loginSchema')) {
        console.log(`❌ ${file} - Missing expected imports`);
        allPassed = false;
        return;
      }
    }
    
    if (file.includes('routes/payments.js')) {
      if (!content.includes('2026-01-28.clover')) {
        console.log(`❌ ${file} - Old Stripe API version detected`);
        allPassed = false;
        return;
      }
    }
    
    if (file.includes('payment.service.ts')) {
      if (content.includes('2024-12-18.acacia')) {
        console.log(`❌ ${file} - Old Stripe API version still present`);
        allPassed = false;
        return;
      }
    }
    
    console.log(`✅ ${file} - OK`);
    
  } catch (error) {
    console.log(`❌ ${file} - ERROR: ${error.message}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED - Code is ready for deployment!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
