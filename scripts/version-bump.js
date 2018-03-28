const replace = require('replace-in-file');
const pjson = require('../package.json');

replace({
  files: ['./src/ios/SentryCordova.m', './src/js/frontend.ts'],
  from: /\d+\.\d+.\d+/g,
  to: pjson.version,
})
  .then(changedFiles => {
    console.log('Modified files:', changedFiles.join(', '));
    return replace({
      files: ['plugin.xml'],
      // from: /id="@sentry\/cordova" version="\d+\.\d+.\d+"/g,
      // to: `id="@sentry/cordova" version="${pjson.version}"`,
      from: /id="sentry-cordova" version="\d+\.\d+.\d+"/g,
      to: `id="sentry-cordova" version="${pjson.version}"`,
    });
  })
  .then(changedFiles => {
    console.log('Modified files:', changedFiles.join(', '));
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });
