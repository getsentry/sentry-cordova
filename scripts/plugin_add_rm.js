module.exports = function(ctx) {
  try {
    if (!ctx.opts.plugins.some(plugin => plugin.includes('sentry-cordova'))) {
      return;
    }
  } catch (e) {}

  console.log(`Sentry: running ${ctx.hook} - set SENTRY_SKIP_WIZARD=true to skip this`);

  if (process.env.SENTRY_SKIP_WIZARD) {
    console.log('Sentry: Skipping Sentry Wizard');
    return;
  }

  // do `require` if we're not skipping sentry wizard
  const wizard = require('@sentry/wizard');
  const tty = require('tty');
  const fs = require('fs');

  let uninstall = false;

  const fromProps = 'sentry.properties';
  if (process.stdin.isTTY) {
    if (ctx.hook === 'before_plugin_rm') {
      uninstall = true;
      if (uninstall && fs.existsSync(fromProps)) {
        console.log(`Sentry: removing ${fromProps}`);
        fs.unlinkSync(fromProps);
      }
    }
    return wizard.run({
      quiet: false,
      integration: 'cordova',
      skipConnect: fs.existsSync(fromProps),
      quiet: fs.existsSync(fromProps),
      uninstall: uninstall,
    });
  } else {
    console.error('***********************************************');
    console.error('Sentry - Warning');
    console.error('https://docs.sentry.io/clients/cordova/ionic/');
    console.error('***********************************************');
    console.error(`You've run this command with the ionic prefix`);
    console.error(`either run it without 'ionic' or do run:`);
    uninstall ? console.error('$ sentry-wizard --uninstall') : console.error('$ sentry-wizard');
    console.error('See: https://github.com/getsentry/sentry-wizard');
    console.error('***********************************************');
    console.error('***********************************************');
  }
};
