#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sampleDir = path.join(__dirname, '..');
const platformsDir = path.join(sampleDir, 'platforms');
const platforms = ['android', 'browser', 'ios'];

// Check which platforms exist
const existingPlatforms = new Set();
if (fs.existsSync(platformsDir)) {
  const dirs = fs.readdirSync(platformsDir);
  dirs.forEach(dir => {
    if (platforms.includes(dir)) {
      existingPlatforms.add(dir);
    }
  });
}

// Remove platforms that exist
platforms.forEach(platform => {
  if (existingPlatforms.has(platform)) {
    console.log(`Removing platform ${platform}...`);
    try {
      execSync(`yarn cordova platform rm ${platform}`, {
        cwd: sampleDir,
        stdio: 'inherit'
      });
    } catch (error) {
      console.error(`Failed to remove platform ${platform}:`, error.message);
    }
  } else {
    console.log(`Platform ${platform} not found, skipping...`);
  }
});
