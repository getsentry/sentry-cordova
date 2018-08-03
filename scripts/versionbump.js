const replace = require('replace-in-file');
const newVersion = process.argv[2];

if (!newVersion || !newVersion.match(/^\d+\.\d+\.\d+$/)) {
  console.log(`Invalid version: ${newVersion}`);
  process.exit(1);
}

replace({
  files: ['./src/ios/SentryCordova.m', './src/js/version.ts'],
  from: /\d+\.\d+.\d+/g,
  to: newVersion,
})
  .then(changedFiles => {
    console.log('Modified files:', changedFiles.join(', '));
    return replace({
      files: ['plugin.xml'],
      // from: /id="@sentry\/cordova" version="\d+\.\d+.\d+"/g,
      // to: `id="@sentry/cordova" version="${pjson.version}"`,
      from: /id="sentry-cordova" version="\d+\.\d+.\d+"/g,
      to: `id="sentry-cordova" version="${newVersion}"`,
    });
  })
  .then(changedFiles => {
    console.log('Modified files:', changedFiles.join(', '));
  })
  .catch(error => {
    console.error('Error occurred:', error);
    process.exit(1);
  });
