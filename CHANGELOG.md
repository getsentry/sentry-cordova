# Changelog

## 1.3.0

### Features

- Add options for iOS: enableAppHangTracking and appHangTimeoutInterval, allowing users to define the App hang timeout or completly disabling it. ([#338](https://github.com/getsentry/sentry-cordova/pull/338))

### Dependencies

- Bump `sentry-wizard` to 3.21.0 ([#544](https://github.com/getsentry/sentry-wizard/pull/544))
- Bump Android SDK from v6.11.0 to v7.6.0 ([#336](https://github.com/getsentry/sentry-capacitor/pull/336))
  - [changelog](https://github.com/getsentry/sentry-java/blob/main/CHANGELOG.md#760)
  - [diff](https://github.com/getsentry/sentry-java/compare/6.11.0...7.6.0)
- build(ios): Bump `sentry-cocoa` to 8.21.0 ([#337](https://github.com/getsentry/sentry-cordova/pull/337))
  - [changelog](https://github.com/getsentry/sentry-cocoa/releases/tag/8.21.0)
  - [diff](https://github.com/getsentry/sentry-cocoa/compare/8.13.1...8.21.0)

## 1.2.0

### Fixes

-  Fix iOS not bundling ([#316](https://github.com/getsentry/sentry-cordova/pull/316))

### Dependencies

- Bump `sentry-wizard` to 3.16.1 ([#481](https://github.com/getsentry/sentry-wizard/pull/481))
- build(ios): Bump `sentry-cocoa` to 8.13.1 ([#316](https://github.com/getsentry/sentry-cordova/pull/316))
  - [changelog](https://github.com/getsentry/sentry-cocoa/releases/tag/8.13.1)
  - [diff](https://github.com/getsentry/sentry-cocoa/compare/7.27.1...8.13.1)

### Warning, breaking changes

- The option `enableOutOfMemoryTracking` is now `enableWatchdogTerminationTracking`. The previous name will keep working but will be removed on a major version.
- Bump minimum supported OS versions to macOS 10.13, iOS 11.

## 1.1.5

### Fixes

- iOS compile issue([#309](https://github.com/getsentry/sentry-cordova/pull/309))

## 1.1.4

### Dependencies

- Bump Sentry JavaScript SDK to `7.34.0` ([#302](https://github.com/getsentry/sentry-cordova/pull/302))
  - [changelog](https://github.com/getsentry/sentry-javascript/releases/tag/7.34.0)
  - [diff](https://github.com/getsentry/sentry-javascript/compare/6.1.0...7.34.0)
- build(android): Bump Android SDK to 6.11.0 ([#302](https://github.com/getsentry/sentry-cordova/pull/302))
  - [changelog](https://github.com/getsentry/sentry-java/releases/tag/6.11.0)
  - [diff](https://github.com/getsentry/sentry-java/compare/6.4.1...6.11.0)
- build(ios): Bump `sentry-cocoa` to 7.27.1 ([#302](https://github.com/getsentry/sentry-cordova/pull/302))
  - [changelog](https://github.com/getsentry/sentry-cocoa/releases/tag/7.27.1)
  - [diff](https://github.com/getsentry/sentry-cocoa/compare/6.2.1...7.27.1)

## 1.0.4

### Fixes

- build(android): Bump Android SDK to 6.4.1 ([#286](https://github.com/getsentry/sentry-cordova/pull/286))
  - [changelog](https://github.com/getsentry/sentry-java/releases/tag/6.4.1)
  - [diff](https://github.com/getsentry/sentry-java/compare/4.1.0...6.4.1)

## 1.0.3

### Fixes

- Add missing info.plist ([#268](https://github.com/getsentry/sentry-cordova/pull/268))

## 1.0.2

### Fixes

- Enhance package validation and Removed Symbolic Links ([#267](https://github.com/getsentry/sentry-cordova/pull/267))
- Sentry.xcframework being excluded by npm rule ([#266](https://github.com/getsentry/sentry-cordova/pull/266))

## 1.0.1

### Fixes

- Fix build on Mac M1 ([#262](https://github.com/getsentry/sentry-cordova/pull/262))
- Support for running with cordova-android 10 ([#246](https://github.com/getsentry/sentry-cordova/pull/246))

## v1.0.0

### Features

- Full scope sync such that any tag, context, extra, and breadcrumb set on the JavaScript scope will be available on crashes that happen on the native (iOS/Android) layer. You can also sync down to the NDK layer on Android if you opt-in through: `enableNdkScopeSync`.- Offline event caching for Android. (already an existing feature on iOS)
- Performance monitoring support: the Sentry Cordova SDK now supports JavaScript-layer performance monitoring and tracing, when you integrate the `@sentry/tracing` package. You can then start a transaction just by calling `Sentry.startTransaction`.
- Session tracking and release health on Android and iOS.
- Official support for the browser platform.

### Fixes

- `event.origin` and `event.environment` tags to show which layer of the app the event originated from.

### Migration

### Fixes

- Deprecated `setRelease` and `setDist`; instead pass `release` and `dist` to the `Sentry.init` call.
- Minimum Typescript version is now `3.0.0`

## v1.0.0-rc.2

### Features

- Expose startTransaction ([#216](https://github.com/getsentry/sentry-cordova/pull/216))

### Fixes

- Remove setRelease and setDist, have auto release passed to native ([#213](https://github.com/getsentry/sentry-cordova/pull/213))

## v1.0.0-rc.1

### Features

- Set `event.origin` and `event.environment` tags ([#204](https://github.com/getsentry/sentry-cordova/pull/204))
- feat(android): Add Android native bridge, full scope sync, and cached events ([#202](https://github.com/getsentry/sentry-cordova/pull/202))

### Fixes

- fix(ios): Handle auto session tracking start on iOS ([#210](https://github.com/getsentry/sentry-cordova/pull/210))
- Support clearing user with null on iOS native bridge ([#207](https://github.com/getsentry/sentry-cordova/pull/207))
- build(ios): Bump `sentry-cocoa` to 6.2.1 ([#205](https://github.com/getsentry/sentry-cordova/pull/205))

## v1.0.0-rc.0

### Features

- Add global error handler wrapper method for Ionic ([#190](https://github.com/getsentry/sentry-cordova/pull/190))
- Add Native Wrapper and Cordova Transport ([#194](https://github.com/getsentry/sentry-cordova/pull/194))

### Fixes

- build(internal): Switch to eslint
- Fix all errors from platforms without native module such as browser ([#199](https://github.com/getsentry/sentry-cordova/pull/199))
- build(ios): Bump sentry-cocoa to 6.1.4 ([#194](https://github.com/getsentry/sentry-cordova/pull/194))
- build(android): Bump Android SDK to v4.1.0 ([#187](https://github.com/getsentry/sentry-cordova/pull/187))

## v0.17.0

### Features

- Add `SENTRY_ANDROID_SDK_VERSION` to configure Android SDK version

### Fixes

- Replicate cordova prepare functionality for getting platform path

## v0.16.2

### Fixes

- Sentry generating a lot of "not implemented" errors ([#146](https://github.com/getsentry/sentry-cordova/commit/8922f6361583f7cf38429862aeda5e2a90d3e949))

## v0.16.1

### Fixes

- NSInvalidArgumentException on iOS ([#147](https://github.com/getsentry/sentry-cordova/issues/147))

## v0.16.0

### Fixes

- Bump `@sentry/*` `~5.6.0`
- Bump `sentry-cocoa` `4.4.0`
- Use raw payload to send on iOS

## v0.15.0

### Fixes

- Bump `@sentry/*` `5.1.0`
- exec proxy not found for :: Sentry :: install ([#65](https://github.com/getsentry/sentry-cordova/issues/65))

## v0.14.0

### Fixes

- Bump `@sentry/*` `4.6.6`
- Failed to restore plugin "sentry-cordova" from config.xml ([#91](https://github.com/getsentry/sentry-cordova/issues/91))
- Remove usage of deprecated requireCordovaModule ([#120](https://github.com/getsentry/sentry-cordova/pull/120))

## v0.13.1

### Fixes

- Fix `level` parameter

## v0.13.0

### Fixes

- Using `@sentry/*` `~4.3.0` packages

## v0.12.3

### Fixes

- Sentry changes the SENTRY_RELEASE only after the apk has been build ([#83](https://github.com/getsentry/sentry-cordova/pull/83))

## v0.12.2

### Fixes

- Remove sourcemap from plugins Fixed ([#76](https://github.com/getsentry/sentry-cordova/issues/76))

## v0.12.1

### Fixes

- Uncaught (in promise): not implemented ([#72](https://github.com/getsentry/sentry-cordova/issues/72))
- Using `@sentry/*` `4.0.0-beta.12` packages

## v0.12.0

### Fixes

- Remove or adding other plugins gives sentry messages ([#70](https://github.com/getsentry/sentry-cordova/pull/70))

## v0.11.0 - Warning, breaking changes

- Using `@sentry/*` `4.0.0-beta` packages
- Fixes setting version on android ([#54](https://github.com/getsentry/sentry-cordova/pull/54))
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

### Fixes

- Fix es5 syntax in build script

## v0.10.1

### Fixes

- Fix es5 syntax in build script

## v0.10.0

### Fixes

- Use unminified version of bundle
- Bundle and compile in one step

## v0.9.1

### Fixes

- Fix release script

## v0.9.0 - Warning, breaking changes

- Breaking change: Renamed create to init

### Features

- Use es5 target and update deps ([48](https://github.com/getsentry/sentry-cordova/pull/48))

### Fixes

- Update dependencies

## v0.8.5

### Fixes

- Fix internal console.error endless loop

## v0.8.4

### Fixes

- Fix private DSN

## v0.8.3

### Fixes

- Fix missing source of ios/android

## v0.8.2

### Fixes

- Bump to `sentry-cocoa` `3.12.2`

## v0.8.1

### Fixes

- Bump to `sentry-cocoa` `3.12.1`, fix build

## v0.8.0 - Warning, breaking changes

- We are using the new version of `@sentry/core` & `@sentry/browser` installation and setup is now different. Please see
  https://docs.sentry.io/ for more information.
- We also renamed to package from `@sentry/cordova` to `sentry-cordova` since cordova has problems dealing with
  namespaced packages.

## v0.7.0

### Features

- Using new `0.4.0` of `@sentry/core` & `@sentry/browser`
- Bump `sentry-wizard` to fix ([29](https://github.com/getsentry/sentry-cordova/issues/29))

## v0.6.0

### Fixes

- Fixed #13

### Features

- Added SENTRY_SKIP_WIZARD to skip wizard invocation

## v0.5.3

### Fixes

- Fix sentry.properties location

## v0.5.2

### Fixes

- Require cordova 7.0.0 and cordova-ios 4.4.0 since we need to support embedded frameworks

## v0.5.1

### Fixes

- Removed console.log

## v0.5.0

### Fixes

- Uploading of all build assests @DavidStrausz
- install/uninstall with wizard
- Move sentry.properties into plugin folder

## v0.4.0

### Features

- Detect tty if sentry-wizard should run on the setup process
- Added SENTRY_SKIP_AUTO_RELEASE to skip automatic release version
- Enabled automatic breadcrumb tracking on iOS

## v0.3.0

### Fixes

- Bump sentry-wizard and sentry-cli to use new JS interface

## v0.2.1

### Fixes

- Fix travis

## v0.2.0

### Fixes

- Rename sentry release window global var for Ionic ([#5](https://github.com/getsentry/sentry-cordova/pull/5))

## v0.1.3

### Fixes

- Fix build for iOS project (add framework)

## v0.1.2

### Features

- Bump sentry-wizard

## v0.1.1

### Features

- Add CI and build stuff

## v0.1.0

### First release

- Initial Release
