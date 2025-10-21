#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..');
const targetDir = path.join(__dirname, '..', 'sample', 'sentry-sdk');

// Items to sync
const itemsToSync = ['dist', 'src', 'plugin.xml', 'package.json', 'scripts'];

// Remove existing symlink or directory
if (fs.existsSync(targetDir)) {
  const stats = fs.lstatSync(targetDir);
  if (stats.isSymbolicLink()) {
    fs.unlinkSync(targetDir);
    console.log('Removed symlink: sample/sentry-sdk');
  } else if (stats.isDirectory()) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log('Removed directory: sample/sentry-sdk');
  }
}

// Create target directory
fs.mkdirSync(targetDir, { recursive: true });
console.log('Created directory: sample/sentry-sdk');

// Copy each item
itemsToSync.forEach(item => {
  const sourcePath = path.join(sourceDir, item);
  const targetPath = path.join(targetDir, item);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`Warning: ${item} does not exist, skipping...`);
    return;
  }

  const stats = fs.statSync(sourcePath);

  if (stats.isDirectory()) {
    // Copy directory recursively
    fs.cpSync(sourcePath, targetPath, { recursive: true });
    console.log(`Copied directory: ${item}`);
  } else {
    // Copy file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied file: ${item}`);
  }
});

console.log('Sample sync complete!');

