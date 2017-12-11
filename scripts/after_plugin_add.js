module.exports = function(ctx) {
  const wizard = require('@sentry/wizard');
  return wizard.run({
    quiet: false,
  });
};
