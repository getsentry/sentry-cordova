/* eslint-disable no-unused-vars */
let sentryCache = null;

const Sentry = {
/***
 * @type {import("sentry-cordova")}
 */
  get instance() {

    if (!sentryCache) {
      sentryCache = cordova.require('sentry-cordova.Sentry', 'debug');
    }
    return sentryCache;
  }
};


function captureHandled() {
  try {
      data_throwerror();
  } catch (error) {
    Sentry.instance.captureException(error);
  }

}

function captureUnhandled() {
  data_throwunhandled();
}

function addTag() {
  Sentry.instance.configureScope(scope => scope.u);

}

function removeTag() {
  Sentry.instance.setTag('tag', undefined);
}

function addBreadcrumb() {
  Sentry.instance.addBreadcrumb({
      category: 'auth',
      message: 'Auhenticated user 1234',
      level: 'log',
    });

}

function captureMessage() {
  Sentry.instance.captureMessage('test');
}

function nativeCrash() {
  Sentry.instance.nativeCrash();
}

function navigateCrash() {
  navigateToPage('otherpage.html', 'js/otherpage.js');
}

