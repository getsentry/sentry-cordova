build:
	cd src/ios; carthage update --use-xcframeworks --platform ios; carthage build --use-xcframeworks --no-use-binaries --platform ios; rm -f Carthage/Build/SentrySwiftUI.xcframework
