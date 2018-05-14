module.exports = function(ctx) {
  console.log(
    `Sentry: running ${ctx.hook} - set SENTRY_SKIP_WIZARD=true to skip this`
  );
  const wizard = require('@sentry/wizard');
  const tty = require('tty');
  const fs = ctx.requireCordovaModule('fs');

  let uninstall = false;

  if (process.env.SENTRY_SKIP_WIZARD) {
    console.log('Sentry: Skipping Sentry Wizard');
    return;
  }

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
    uninstall
      ? console.error('$ sentry-wizard --uninstall')
      : console.error('$ sentry-wizard');
    console.error('See: https://github.com/getsentry/sentry-wizard');
    console.error('***********************************************');
    console.error('***********************************************');
  }
};
