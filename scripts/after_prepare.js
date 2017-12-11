module.exports = function(ctx) {
  const SentryCli = require('@sentry/cli');
  const path = ctx.requireCordovaModule('path');
  const fs = ctx.requireCordovaModule('fs');
  const crypto = require('crypto');

  function checksum(str) {
    return crypto
      .createHash('sha1')
      .update(str, 'utf8')
      .digest('hex');
  }

  const buildPath = path.join(ctx.opts.paths[0], 'build');
  if (!fs.existsSync(buildPath)) {
    console.error('build path does not exist');
    process.exit(1);
    return;
  }

  const configFile = path.join(
    buildPath,
    '..',
    '..',
    ctx.opts.platforms[0] === 'android' ? '..' : '',
    'sentry.properties'
  );

  if (!fs.existsSync(configFile)) {
    console.error(
      'sentry.properties does not exist, please run `sentry-wizard -i cordova`'
    );
    process.exit(1);
    return;
  }

  // Adding files to include
  let includes = [];
  includes.push(path.join(buildPath, 'main.js'));
  includes.push(path.join(buildPath, 'main.js.map'));
  includes.push(path.join(buildPath, 'vendor.js.map'));
  includes.push(path.join(buildPath, 'vendor.js'));

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

  fs.writeFileSync(
    path.join(buildPath, 'sentry-release.json'),
    JSON.stringify({ id: release })
  );

  const ignore = ['node_modules'];

  const sentryCli = new SentryCli(configFile);

  return sentryCli
    .createRelease(release)
    .then(() =>
      sentryCli.uploadSourceMaps({
        release: release,
        include: includes,
        ignore: ignore,
      })
    )
    .then(() => sentryCli.finalizeRelease(release));
};
