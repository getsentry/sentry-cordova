module.exports = function(ctx) {
  const wizard = require('@sentry/wizard');
  const tty = require('tty');

  if (process.stdin.isTTY) {
    return wizard.run({
      quiet: false,
      integration: 'cordova',
    });
  } else {
    console.error('***********************************************');
    console.error('Sentry Setup Incomplete');
    console.error('***********************************************');
    console.error('Please run:');
    console.error('$ sentry-wizard');
    console.error('to fully setup your project');
    console.error('See: https://github.com/getsentry/sentry-wizard');
    console.error('***********************************************');
    console.error('***********************************************');
  }
};
