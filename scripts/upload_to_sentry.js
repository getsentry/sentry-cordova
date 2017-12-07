const SentryCli = require('@sentry/cli');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function checksum(str) {
  return crypto
    .createHash('sha1')
    .update(str, 'utf8')
    .digest('hex');
}

const ignore = ['node_modules'];

const configFile = path.join(
  ctx.opts.projectRoot,
  'platforms',
  ctx.opts.platforms[0],
  '/sentry.properties'
);

// Adding files to include
let includes = [];
ctx.opts.paths.forEach(platformPath => {
  includes.push(path.join(platformPath, 'build', 'main.js'));
  includes.push(path.join(platformPath, 'build', 'main.js.map'));
  includes.push(path.join(platformPath, 'build', 'vendor.js.map'));
  includes.push(path.join(platformPath, 'build', 'vendor.js'));
});

const algorithm = 'sha1';
let allHash = '';

includes.forEach(file => {
  let shasum = crypto.createHash(algorithm);
  shasum.update(fs.readFileSync(file));
  allHash += shasum.digest('hex');
});

const shasum2 = crypto.createHash(algorithm);
shasum2.update(allHash);
const fileHash = shasum2.digest('hex');
const release = fileHash.slice(0, 7);

const sentryCli = new SentryCli({
  release: release,
  include: includes,
  ignore: ignore,
  configFile: configFile,
});
return sentryCli
  .createRelease(release)
  .then(() => sentryCli.uploadSourceMaps(sentryCliConfig))
  .then(() => sentryCli.finalizeRelease(release));
