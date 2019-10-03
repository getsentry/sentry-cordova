module.exports = function(ctx) {
  console.log(
    `Sentry: running ${
      ctx.hook
    } - set SENTRY_SKIP_AUTO_RELEASE=true to skip this`
  );
  const SentryCli = require('@sentry/cli');
  const path = require('path');
  const fs = require('fs');
  const crypto = require('crypto');

  if (process.env.SENTRY_SKIP_AUTO_RELEASE) {
    console.log('Sentry: Skipping Sentry auto release');
    return;
  }

  function checksum(str) {
    return crypto
      .createHash('sha1')
      .update(str, 'utf8')
      .digest('hex');
  }

  function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(file => {
      file = dir + '/' + file;
      let stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(file));
      } else {
        results.push(file);
      }
    });
    return results;
  }

  const configFile = path.join('sentry.properties');
  if (!fs.existsSync(configFile)) {
    console.error('Sentry: sentry.properties does not exist in project root!`');
    process.exit(1);
    return;
  }
  const ignore = ['node_modules'];
  const sentryCli = new SentryCli(configFile);

  const projectRoot = ctx.opts.projectRoot || '';
  const buildPaths = ctx.opts.platforms.map(p => path.join(projectRoot, 'platforms', p, 'www'));

  const allReleases = buildPaths.map(buildPath => {
    if (!fs.existsSync(buildPath)) {
      console.error(`Sentry: build path does not exist ${buildPath}`);
      console.error('This is not an Ionic project, please check out:');
      console.error('https://docs.sentry.io/clients/javascript/sourcemaps/');
      console.error(
        'to find out how to correctly upload sourcemaps for your project.'
      );
      return;
    }

    const indexHtml = path.join(buildPath, 'index.html');
    if (!fs.existsSync(indexHtml)) {
      console.error('Sentry: index.html does not exist');
      return;
    }

    // Adding files to include
    let includes = [];
    walk(buildPath).forEach((file, index) => {
      let f = path.basename(file);
      let [ext2, ext1, name] = f.split('.').reverse();
      // we only want js source files and the according sourcemaps (no css etc.)
      if (ext2 === 'js' || (ext1 === 'js' && ext2 === 'map')) {
        // ignore sw-toolbox file
        if (name !== 'sw-toolbox') {
          includes.push(file);
        }
      }
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

    let release = Promise.resolve(fileHash.slice(0, 20));
    // if the environment variable SENTRY_RELEASE_STRING is set this will be used instead of the filehash slice
    if (process.env.SENTRY_RELEASE_STRING) {
        release = Promise.resolve(process.env.SENTRY_RELEASE_STRING);
    } else if (process.env.SENTRY_RELEASE_PROPOSE_VERSION) {
        release = sentryCli.releases.proposeVersion();
    }

    return release.then(
        release => {
            const regex = /<head>(?:[\s\S]*(<!-- sentry-cordova -->))?/g;
            let contents = fs.readFileSync(indexHtml, {
                encoding: 'utf-8',
            });
            const releaseSentry = `
    <script>
    (function(w){var i=w.SENTRY_RELEASE=w.SENTRY_RELEASE||{};i.id='${release}';})(this);
    </script>
    <!-- sentry-cordova -->`;
            const replaceWith = `<head>${releaseSentry}`;
            fs.writeFileSync(indexHtml, contents.replace(regex, replaceWith));

            // This is allowed to fail because it's ionic specific
            const projectRootIndexHtml = path.join(
                ctx.opts.projectRoot,
                'src',
                'index.html'
            );
            if (fs.existsSync(projectRootIndexHtml)) {
                contents = fs.readFileSync(projectRootIndexHtml, {
                    encoding: 'utf-8',
                });
                fs.writeFileSync(
                    projectRootIndexHtml,
                    contents.replace(regex, replaceWith)
                );
            }

            console.log(`Uploading assets release: '${release}' path: ${buildPath}`);
            return sentryCli.releases
                .new(release)
                .then(() =>
                    sentryCli.releases.uploadSourceMaps(release, {
                        include: includes,
                        ignore: ignore,
                    })
                )
                .then(() => sentryCli.releases.finalize(release));
        }
    )
  });

  return Promise.all(allReleases);
};
