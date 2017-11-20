module.exports = function(ctx) {
  const wizard = require('@sentry/wizard');
  const SentryCliPlugin = require('@sentry/webpack-plugin');
  const SentryCli = require('@sentry/webpack-plugin/src/sentry-cli');
  const path = ctx.requireCordovaModule('path');
  const fs = ctx.requireCordovaModule('fs');
  const crypto = require('crypto');

  function checksum(str) {
    return crypto
      .createHash('sha1')
      .update(str, 'utf8')
      .digest('hex');
  }
  return wizard
    .run({
      help: false,
      version: false,
      debug: false,
      uninstall: false,
      url: 'http://localhost:8000/',
      type: 'cordova',
      platform: ctx.opts.platforms[0],
    })
    .then(() => {
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

      const sentryCliConfig = new SentryCliPlugin({
        release: release,
        include: includes,
        ignore: ignore,
        configFile: configFile,
      });

      const sentryCli = new SentryCli(configFile);
      return sentryCli
        .createRelease(release)
        .then(() => sentryCli.uploadSourceMaps(sentryCliConfig))
        .then(() => sentryCli.finalizeRelease(release));
    });
};
