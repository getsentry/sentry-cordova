module.exports = function(ctx) {
  const wizard = require('@sentry/wizard');
  const tty = require('tty');
  const path = require('path');

  if (process.stdin.isTTY) {
    return wizard.run({
      quiet: false,
      integration: 'cordova',
    });
  } else {
    console.error('Please run $ sentry-wizard to fully setup your project');
    console.error('$ sentry-wizard to fully setup your project');
    console.error('to fully setup your project');
    console.error('See: https://github.com/getsentry/sentry-wizard');
  }
};
