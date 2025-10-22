build:
	cd src/ios && \
	rm -rf Carthage/Build &&
  carthage update --use-xcframeworks --platform ios --no-use-binaries --cache-builds && \
  carthage build --use-xcframeworks --no-use-binaries --platform iOS \
      --xcodebuild-arguments='EXCLUDED_ARCHS=arm64e ONLY_ACTIVE_ARCH=NO' && \
  rm -r Carthage/Build/SentrySwiftUI.xcframework
