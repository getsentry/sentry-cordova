build:
	cd src/ios && \
  carthage update --use-xcframeworks --platform ios && \
  EXCLUDED_ARCHS=arm64e carthage build --use-xcframeworks --no-use-binaries --platform ios && \
  rm -r Carthage/Build/SentrySwiftUI.xcframework
