# Changelog

## v0.16.2

- Fix #146

## v0.16.1

- Fix #147

## v0.16.0

- Bump `@sentry/*` `~5.6.0`
- Bump `sentry-cocoa` `4.4.0`
- Use raw payload to send on iOS

## v0.15.0

- Bump `@sentry/*` `5.1.0`
- Fix #65

## v0.14.0

- Bump `@sentry/*` `4.6.6`
- Fix #91
- Fix #120

## v0.13.1

- Fix `level` parameter

## v0.13.0

- Using `@sentry/*` `~4.3.0` packages

## v0.12.3

- Fixed #81

## v0.12.2

- Remove sourcemap from plugins Fixed #76

## v0.12.1

- Fixed #72
- Using `@sentry/*` `4.0.0-beta.12` packages

## v0.12.0

- Fixed #66

## v0.11.0 - Warning, breaking changes

- Using `@sentry/*` `4.0.0-beta` packages
- Fixes setting version on android #54
- Breaking change:

Replaced functions `setUserContext` `setTagsContext` `setExtraContext` with:

```
Sentry.configureScope(scope => {
  scope.setUser({ id: '123', email: 'test@sentry.io', username: 'sentry' });
  scope.setTag('cordova', 'true');
  scope.setExtra('myData', ['1', 2, '3']);
});
```

## v0.10.2

- Fix es5 syntax in build script

## v0.10.1

- Fix es5 syntax in build script

## v0.10.0

- Use unminified version of bundle
- Bundle and compile in one step

## v0.9.1

- Fix release script

## v0.9.0 - Warning, breaking changes

- Breaking change: Renamed create to init
- Update dependencies
- Fixed #47

## v0.8.5

- Fix internal console.error endless loop

## v0.8.4

- Fix private DSN

## v0.8.3

- Fix missing source of ios/android

## v0.8.2

- Bump to `sentry-cocoa` `3.12.2`

## v0.8.1

- Bump to `sentry-cocoa` `3.12.1`, fix build

## v0.8.0 - Warning, breaking changes

- We are using the new version of `@sentry/core` & `@sentry/browser` installation and setup is now different. Please see
  https://docs.sentry.io/ for more information.
- We also renamed to package from `@sentry/cordova` to `sentry-cordova` since cordova has problems dealing with
  namespaced packages.

## v0.7.0

- Using new `0.4.0` of `@sentry/core` & `@sentry/browser`
- Bump `sentry-wizard` to fix #29

## v0.6.0

- Fixed #13
- Added SENTRY_SKIP_WIZARD to skip wizard invocation

## v0.5.3

- Fix sentry.properties location

## v0.5.2

- Require cordova 7.0.0 and cordova-ios 4.4.0 since we need to support embed framework s

## v0.5.1

- Removed console.log

## v0.5.0

- Fix uploading of all build assests @DavidStrausz
- Fix install/uninstall with wizard
- Move sentry.properties into plugin folder

## v0.4.0

- Detect tty if sentry-wizard should run on the setup process
- Added SENTRY_SKIP_AUTO_RELEASE to skip automatic release version
- Enabled automatic breadcrumb tracking on iOS

## v0.3.0

- Bump sentry-wizard and sentry-cli to use new JS interface

## v0.2.1

- Fix travis

## v0.2.0

- Rename sentry release window global var for Ionic #5

## v0.1.3

- Fix build for iOS project (add framework)

## v0.1.2

- Bump sentry-wizard

## v0.1.1

- Add CI and build stuff

## v0.1.0

- Initial Release
