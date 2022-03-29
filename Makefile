build:
	cd src/ios; carthage update
	cd src/ios; carthage update --use-xcframeworks
