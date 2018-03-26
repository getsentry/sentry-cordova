#!/bin/sh

brew update > /dev/null
brew outdated carthage || brew upgrade carthage
make build
yarn install
yarn build
yarn pack
