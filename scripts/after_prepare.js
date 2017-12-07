module.exports = function(ctx) {
  const wizard = require('@sentry/wizard');

  // console.log(ctx.opts);
  // console.log(process.env);

  return wizard.run({
    help: false,
    version: false,
    debug: false,
    uninstall: false,
    integration: 'cordova',
    platform: [ctx.opts.platforms[0]],
  });
};
