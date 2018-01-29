module.exports = function(ctx) {
  const path = ctx.requireCordovaModule('path');
  const fs = ctx.requireCordovaModule('fs');

  let uninstall = false;
  if (ctx.hook === 'after_plugin_uninstall') {
    uninstall = true;
  }

  if (ctx.opts.plugin.platform === 'ios') {
    /// we only want to do this on iOS
    const iosPath = path.join('platforms', 'ios', 'sentry.properties');
    if (uninstall) {
      console.log(`Sentry: removing ${iosPath}`);
      fs.unlinkSync(iosPath);
    } else {
      console.log(`Sentry: copying ${iosPath}`);
      fs.writeFileSync(
        iosPath,
        fs.readFileSync(path.join(ctx.opts.plugin.dir, 'sentry.properties'), 'utf-8')
      );
    }
  }
};
