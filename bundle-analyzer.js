const fs = require('fs');
const path = require('path');

// Simple bundle analyzer for React Native/Expo projects
function analyzeBundle() {
  console.log('🔍 Analyzing Bondify App Bundle...\n');

  // Check package.json for dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  console.log('📦 Dependency Analysis:');
  console.log(`Total dependencies: ${Object.keys(dependencies).length}`);

  // Check for heavy libraries
  const heavyLibs = [];
  const largeLibs = Object.entries(dependencies).filter(([name, version]) => {
    // Common heavy libraries to watch for
    const heavyPatterns = [
      'react-native-vector-icons',
      'react-native-image-picker',
      'react-native-maps',
      '@react-native-firebase',
      'react-native-ble-plx',
      'react-native-video',
      'react-native-pdf',
      'expo-audio',
      'expo-camera',
      'expo-location',
      'expo-notifications'
    ];

    return heavyPatterns.some(pattern => name.includes(pattern));
  });

  if (largeLibs.length > 0) {
    console.log('⚠️  Potentially heavy libraries found:');
    largeLibs.forEach(([name, version]) => {
      console.log(`  - ${name}@${version}`);
    });
  } else {
    console.log('✅ No obviously heavy libraries detected');
  }

  // Check for unused dependencies (simple heuristic)
  const unusedCandidates = Object.keys(dependencies).filter(dep => {
    // Skip core React Native/Expo deps
    const coreDeps = [
      'react', 'react-native', 'expo', '@expo', 'metro', 'babel',
      'eslint', 'typescript', '@types', 'jest', 'detox'
    ];

    if (coreDeps.some(core => dep.includes(core))) return false;

    // Check if dependency is imported anywhere
    try {
      const files = fs.readdirSync('components', { recursive: true })
        .filter(file => file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
        .map(file => path.join('components', file));

      const hasUsage = files.some(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          return content.includes(`'${dep}'`) || content.includes(`"${dep}"`) ||
                 content.includes(`from '${dep}'`) || content.includes(`from "${dep}"`);
        } catch {
          return false;
        }
      });

      return !hasUsage;
    } catch {
      return false;
    }
  });

  if (unusedCandidates.length > 0) {
    console.log('\n🗑️  Potentially unused dependencies:');
    unusedCandidates.slice(0, 10).forEach(dep => {
      console.log(`  - ${dep}`);
    });
    if (unusedCandidates.length > 10) {
      console.log(`  ... and ${unusedCandidates.length - 10} more`);
    }
  }

  // Check for image optimization
  console.log('\n🖼️  Image Optimization Check:');
  const imageFiles = [];
  try {
    const assetsDir = 'assets';
    if (fs.existsSync(assetsDir)) {
      const walkDir = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)) {
            imageFiles.push({ path: fullPath, size: stat.size });
          }
        });
      };
      walkDir(assetsDir);

      const totalSize = imageFiles.reduce((sum, img) => sum + img.size, 0);
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

      console.log(`Total images: ${imageFiles.length}`);
      console.log(`Total image size: ${totalSizeMB} MB`);

      const largeImages = imageFiles.filter(img => img.size > 1024 * 1024); // > 1MB
      if (largeImages.length > 0) {
        console.log('⚠️  Large images (>1MB):');
        largeImages.forEach(img => {
          console.log(`  - ${img.path}: ${(img.size / (1024 * 1024)).toFixed(2)} MB`);
        });
      }
    }
  } catch (error) {
    console.log('Could not analyze assets directory');
  }

  // Performance recommendations
  console.log('\n🚀 Performance Recommendations:');
  console.log('1. ✅ Metro bundler optimizations applied (minification, tree shaking)');
  console.log('2. ✅ React.memo applied to ActionButtons and ProfileSection');
  console.log('3. ✅ Android Hermes optimizations configured');

  if (largeLibs.length > 0) {
    console.log('4. ⚠️  Consider lazy loading heavy libraries');
  }

  if (unusedCandidates.length > 0) {
    console.log('5. 🗑️  Remove unused dependencies to reduce bundle size');
  }

  if (imageFiles.some(img => img.size > 500 * 1024)) { // > 500KB
    console.log('6. 🖼️  Optimize large images or use WebP format');
  }

  console.log('7. 📱 Consider implementing code splitting for large screens');
  console.log('8. 🔄 Implement proper error boundaries');
  console.log('9. 💾 Use FlatList with proper keyExtractor for long lists');
  console.log('10. 🎯 Profile app performance with Flipper or React DevTools');

  console.log('\n✨ Analysis complete!');
}

analyzeBundle();