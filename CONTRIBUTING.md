### Contributing

### Requirements

- Node.JS
- [Cordova](https://www.npmjs.com/package/cordova)
- Some IDE (Visual Studio Code for example)
- Xcode (iOS) and Android Studio (Android)
- CocoaPods (iOS) (sudo gem install cocoapods)
- ios-deploy (for deploying an app on an iOS device) (brew install ios-deploy)
- iOS 11 or higher on a test device.
- run-s (https://www.npmjs.com/package/run-s)

### Building

On the root folder of Sentry Cordova run the following commands:

## all environments

- yarn build

## MacOS additional command

- make (this will build the carthage for Sentry cocoa)

### Testing on a sample project

First, make a build from the SDK using the command `yarn build`.
Then, on the sample project folder, run the following commands::

- yarn install
- yarn platforms:add
- yarn sentry:add

If succeeded, Sentry wizzard will be invoked and your project configured with Sentry Cordova.

Addionally, if you want to remove Sentry Cordova you can run the following command:

```
yarn sentry:remove
```

To build your sample project:

```
yarn build:ios
yarn build:android
yarn build # Build both Android and iOS
```

To test your code you can run the following command:

## iOS

```
cordova run ios
```

Or you can open your project on Xcode and build there

```
open ./platforms/ios/projectname.xcworkspace/
```

NOTE: If you pretend to debug your code, it's recommended to have a Real iPhone/iPad.

NOTE2: If you plan to run on Apple simulators, to make life easier, close all simulators before running any
`run`\`build` command.

## Android

```
cordova emulate android
```

Or open the Android folder inside o the Sample app

### Updating Native Libraries

When updating a native library, please make sure to validate with a sample app to fix any break change or broken code.

## iOS

go to 'src/ios/Carfile' and update the version number.

make sure to fix or warn about any break changes with the altered version before submiting a new Pull Request.

## Android

go to 'plugin.xml' and update the SENTRY_ANDROID_SDK_VERSION version number.

### Updating Sentry Cordova on a test app

the process of updating or testing Sentry Cordova on different versions consists on first removing the previous
installed plugin and then installing the desired on afterward.
