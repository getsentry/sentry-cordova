#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sampleDir = path.join(__dirname, '..');
const platformsDir = path.join(sampleDir, 'platforms');
const platforms = ['android', 'browser', 'ios'];

// Remove symlink first
const symlinkPath = path.join(sampleDir, 'sentry-sdk');
if (fs.existsSync(symlinkPath)) {
  const stats = fs.lstatSync(symlinkPath);
  if (stats.isSymbolicLink()) {
    fs.unlinkSync(symlinkPath);
    console.log('Removed symlink: sample/sentry-sdk');
  }
}

// Check which platforms are already added
const existingPlatforms = new Set();
if (fs.existsSync(platformsDir)) {
  const dirs = fs.readdirSync(platformsDir);
  dirs.forEach(dir => {
    if (platforms.includes(dir)) {
      existingPlatforms.add(dir);
    }
  });
}

// Add platforms that don't exist
platforms.forEach(platform => {
  if (existingPlatforms.has(platform)) {
    console.log(`Platform ${platform} already added, skipping...`);
  } else {
    console.log(`Adding platform ${platform}...`);
    try {
      execSync(`yarn cordova platform add ${platform}`, {
        cwd: sampleDir,
        stdio: 'inherit'
      });
    } catch (error) {
      console.error(`Failed to add platform ${platform}:`, error.message);
    }
  }
});
