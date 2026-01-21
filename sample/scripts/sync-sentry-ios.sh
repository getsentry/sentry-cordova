rm -rf platforms/ios/HelloSentry/Plugins/sentry-cordova
mkdir -p platforms/ios/HelloSentry/Plugins/sentry-cordova
ln -s "$(pwd)/sentry-sdk/src/ios/SentryCordova.m" platforms/ios/HelloSentry/Plugins/sentry-cordova/SentryCordova.m
ln -s "$(pwd)/sentry-sdk/src/ios/SentryCordova.h" platforms/ios/HelloSentry/Plugins/sentry-cordova/SentryCordova.h
cp -R sentry-sdk/src/ios/Carthage/Build/Sentry.xcframework platforms/ios/HelloSentry/Plugins/sentry-cordova/Sentry.xcframework
