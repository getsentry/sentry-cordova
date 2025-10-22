build:
	cd src/ios && \
  carthage update --use-xcframeworks --platform ios && \
  carthage build --use-xcframeworks --no-use-binaries --platform ios --xcodebuild-arguments='EXCLUDED_ARCHS=arm64e'
 && \
  rm -r Carthage/Build/SentrySwiftUI.xcframework
