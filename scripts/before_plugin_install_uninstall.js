module.exports = function(ctx) {
  const wizard = require('@sentry/wizard');
  const tty = require('tty');

  let uninstall = false;

  if (process.env.SENTRY_SKIP_WIZARD) {
    console.log('Skipping Sentry Wizard');
    return;
  }

  if (process.stdin.isTTY) {
    let platform = ['ios', 'android'];
    if (ctx.opts && ctx.opts.plugin && ctx.opts.plugin.platform) {
      platform = [ctx.opts.plugin.platform];
    }
    if (ctx.hook === 'before_plugin_uninstall') {
      uninstall = true;
    }
    return wizard.run({
      quiet: false,
      integration: 'cordova',
      platform: platform,
      uninstall: uninstall,
    });
  } else {
    console.error('***********************************************');
    console.error('Sentry - Warning');
    console.error('https://docs.sentry.io/clients/cordova/ionic/');
    console.error('***********************************************');
    console.error(`You've run this command with the ionic prefix`);
    console.error(`either run it without 'ionic' or do run:`);
    uninstall
      ? console.error('$ sentry-wizard --uninstall')
      : console.error('$ sentry-wizard');
    console.error('See: https://github.com/getsentry/sentry-wizard');
    console.error('***********************************************');
    console.error('***********************************************');
  }
};
