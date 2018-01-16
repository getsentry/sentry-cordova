module.exports = function(ctx) {
  const wizard = require('@sentry/wizard');
  const tty = require('tty');
  const path = require('path');

  if (tty.isatty()) {
    return wizard.run({
      quiet: false,
      integration: 'cordova',
    });
  } else {
    const wizardPath = resolve('@sentry/wizard/bin/sentry-wizard');
    console.error(
      'Please run # \\n\\n' + wizardPath + '\\n\\n # to fully setup your project'
    );
  }
};
