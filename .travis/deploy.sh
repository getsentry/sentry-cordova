#!/bin/sh

brew update > /dev/null
brew outdated carthage || brew upgrade carthage
make build
npm run dist
npm pack