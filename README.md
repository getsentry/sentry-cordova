<p align="center">
  <a href="https://sentry.io/?utm_source=github&utm_medium=logo" target="_blank">
      <img src="https://sentry-brand.storage.googleapis.com/sentry-wordmark-dark-280x84.png" alt="Sentry" width="280" height="84">
  </a>
</p>

<h1>Official Sentry SDK for Cordova (Ionic, ...)</h1>

_Bad software is everywhere, and we're tired of it. Sentry is on a mission to help developers write better software faster, so we can get back to enjoying technology. If you want to join us [<kbd>**Check out our open positions**</kbd>](https://sentry.io/careers/)_

[![build](https://github.com/getsentry/sentry-cordova/workflows/Build%20&%20Test/badge.svg?branch=main)](https://github.com/getsentry/sentry-cordova/actions?query=branch%3Amain)
[![codecov](https://codecov.io/gh/getsentry/sentry-cordova/branch/master/graph/badge.svg)](https://codecov.io/gh/getsentry/sentry-cordova)
[![npm version](https://img.shields.io/npm/v/sentry-cordova.svg)](https://www.npmjs.com/package/sentry-cordova)
[![npm dm](https://img.shields.io/npm/dm/sentry-cordova.svg)](https://www.npmjs.com/package/sentry-cordova)
[![npm dt](https://img.shields.io/npm/dt/sentry-cordova.svg)](https://www.npmjs.com/package/sentry-cordova)

**This is a beta release**

## Usage

### Cordova in `index.html` `onDeviceReady` function:

```javascript
onDeviceReady: function() {
    ...
    var Sentry = cordova.require("sentry-cordova.Sentry");
    Sentry.init({ dsn: '___PUBLIC_DSN___' });
    ...
}
```

### Ionic in your `app.module.ts`:

```javascript
...
import * as Sentry from 'sentry-cordova';
...
Sentry.init({ dsn: '___PUBLIC_DSN___' });
```

## Documentation

* [Installation](https://docs.sentry.io/platforms/javascript/guides/cordova/#install)
* [Using Sentry with Ionic](https://docs.sentry.io/platforms/javascript/guides/cordova/ionic/)
* [Documentation](https://docs.sentry.io/platforms/javascript/guides/cordova/)
