build:
	cd src/ios; carthage update --use-xcframeworks --no-skip-current --platform ios; carthage build --use-xcframeworks --no-use-binaries --no-skip-current --platform ios; rm -r Carthage/Build/SentrySwiftUI.xcframework
