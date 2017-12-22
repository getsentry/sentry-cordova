const replace = require('replace-in-file');
const pjson = require('../package.json');

replace({
  files: ['src/ios/SentryCordova.m'],
  from: /\d+\.\d+.\d+/g,
  to: pjson.version,
})
  .then(changedFiles => {
    console.log('Modified files:', changedFiles.join(', '));
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });
