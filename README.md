<p align="center">
    <a href="https://sentry.io" target="_blank" align="center">
        <img src="https://sentry-brand.storage.googleapis.com/sentry-logo-black.png" width="280">
    </a>
<br/>
    <h1>Official Sentry SDK for Cordova (Ionic, ...)</h1>
</p>

[![Travis](https://img.shields.io/travis/getsentry/sentry-cordova.svg?maxAge=2592000)](https://travis-ci.org/getsentry/sentry-cordova)
[![codecov](https://codecov.io/gh/getsentry/sentry-cordova/branch/master/graph/badge.svg)](https://codecov.io/gh/getsentry/sentry-cordova)
[![npm version](https://img.shields.io/npm/v/sentry-cordova.svg)](https://www.npmjs.com/package/sentry-cordova)
[![npm dm](https://img.shields.io/npm/dm/sentry-cordova.svg)](https://www.npmjs.com/package/sentry-cordova)
[![npm dt](https://img.shields.io/npm/dt/sentry-cordova.svg)](https://www.npmjs.com/package/sentry-cordova)

[![deps](https://david-dm.org/getsentry/sentry-cordova/status.svg)](https://david-dm.org/getsentry/sentry-cordova?view=list)
[![deps dev](https://david-dm.org/getsentry/sentry-cordova/dev-status.svg)](https://david-dm.org/getsentry/sentry-cordova?type=dev&view=list)
[![deps peer](https://david-dm.org/getsentry/sentry-cordova/peer-status.svg)](https://david-dm.org/getsentry/sentry-cordova?type=peer&view=list)

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

* [Installation](https://docs.sentry.io/clients/cordova/#installation)
* [Using Sentry with Ionic](https://docs.sentry.io/clients/cordova/ionic/)
* [Documentation](https://docs.sentry.io/clients/cordova/)
