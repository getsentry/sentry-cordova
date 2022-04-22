build:
	cd src/ios; carthage update --use-xcframeworks; carthage build --use-xcframeworks --no-use-binaries
