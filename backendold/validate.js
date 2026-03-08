const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Backend Structure...\n');

const requiredDirs = [
  'src/config',
  'src/controllers',
  'src/middleware',
  'src/models',
  'src/routes',
  'src/seeders',
];

const requiredFiles = [
  'package.json',
  '.env',
  '.env.example',
  '.gitignore',
  'README.md',
  'QUICKSTART.md',
  'src/server.js',
  'src/config/database.js',
  'src/config/jwt.js',
  'src/config/otp.js',
  'src/models/User.js',
  'src/models/Match.js',
  'src/models/Message.js',
  'src/models/Like.js',
  'src/models/Lookup.js',
  'src/controllers/authController.js',
  'src/controllers/profileController.js',
  'src/controllers/discoverController.js',
  'src/controllers/matchController.js',
  'src/controllers/messageController.js',
  'src/controllers/lookupController.js',
  'src/routes/authRoutes.js',
  'src/routes/profileRoutes.js',
  'src/routes/discoverRoutes.js',
  'src/routes/matchRoutes.js',
  'src/routes/messageRoutes.js',
  'src/routes/lookupRoutes.js',
  'src/middleware/auth.js',
  'src/middleware/errorHandler.js',
  'src/middleware/validation.js',
  'src/seeders/seedLookups.js',
];

let hasErrors = false;

// Check directories
console.log('📁 Checking directories...');
requiredDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    console.log(`  ✓ ${dir}`);
  } else {
    console.log(`  ✗ ${dir} - MISSING`);
    hasErrors = true;
  }
});

console.log('\n📄 Checking files...');
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Try to load modules (syntax check)
console.log('\n🔧 Checking module syntax...');
const modulesToCheck = [
  './src/config/jwt',
  './src/config/otp',
  './src/middleware/errorHandler',
  './src/models/User',
  './src/models/Match',
  './src/models/Message',
  './src/models/Like',
  './src/models/Lookup',
];

modulesToCheck.forEach(module => {
  try {
    require(module);
    console.log(`  ✓ ${module}`);
  } catch (error) {
    console.log(`  ✗ ${module} - ERROR: ${error.message}`);
    hasErrors = true;
  }
});

// Check package.json
console.log('\n📦 Checking package.json...');
try {
  const packageJson = require('./package.json');
  const requiredDeps = [
    'express',
    'mongoose',
    'bcryptjs',
    'jsonwebtoken',
    'dotenv',
    'cors',
    'express-validator',
    'morgan',
    'helmet',
    'express-rate-limit',
  ];

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`  ✓ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ✗ ${dep} - MISSING`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log('  ✗ Error reading package.json:', error.message);
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Validation FAILED - Some issues found');
  process.exit(1);
} else {
  console.log('✅ Validation PASSED - Backend structure is correct!');
  console.log('\n📝 Next steps:');
  console.log('  1. Install MongoDB or use MongoDB Atlas');
  console.log('  2. Run: npm run seed');
  console.log('  3. Run: npm run dev');
  console.log('  4. Test endpoints with curl or Postman');
  process.exit(0);
}
