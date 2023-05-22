const replace = require('replace-in-file');
const newVersion = process.argv[2];

if (!newVersion || !newVersion.match(/\d+\.\d+.\d+(?:-\w+(?:\.\w+)?)?/)) {
  console.log(`Invalid version: ${newVersion}`);
  process.exit(1);
}

function ShowModifiedFiles(changedFiles) {
  const files = changedFiles.map(item => item.file);
  console.log('Modified files:', files.join(', '));
}

replace({
  files: ['./src/js/version.ts'],
  from: /\d+\.\d+.\d+(?:-\w+(?:\.\w+)?)?/g,
  to: newVersion,
})
  .then(changedFiles => {
    ShowModifiedFiles(changedFiles);
    return replace({
      files: ['plugin.xml'],
      // from: /id="@sentry\/cordova" version="\d+\.\d+.\d+"/g,
      // to: `id="@sentry/cordova" version="${pjson.version}"`,
      from: /id="sentry-cordova" version="\d+.\d+.\d+[^"]*"/g,
      to: `id="sentry-cordova" version="${newVersion}"`,
    });
  })
  .then(changedFiles => {
    ShowModifiedFiles(changedFiles);
  })
  .catch(error => {
    console.error('Error occurred:', error);
    process.exit(1);
  });
