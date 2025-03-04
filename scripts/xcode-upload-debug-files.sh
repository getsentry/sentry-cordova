#!/bin/bash
# print commands before executing them and stop on first error
set -x -e

echo "warning: uploading debug symbols - set SENTRY_SKIP_DSYM_UPLOAD=true to skip this"

NODE_BINARY=$(command -v node || echo "")
export NODE_BINARY

IOS_PROJ_PATH=$(pwd)

# Override the default with the global environment
ENV_PATH="$IOS_PROJ_PATH/.xcode.env"
if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
fi

# Override the global with the local environment
LOCAL_ENV_PATH="${ENV_PATH}.local"
if [ -f "$LOCAL_ENV_PATH" ]; then
    source "$LOCAL_ENV_PATH"
fi

if [ -z "$NODE_BINARY" ]; then
  echo "[Warning]: Node path was not found on \`.xcode.env\` and \`.xcode.env.local.\`. " \
  "You can quickly fix this by going to the path \`${IOS_PROJ_PATH}\`  and running the following script: " \
  " \`echo export NODE_BINARY=\$(command -v node) > .xcode.env\` " \
  " Node is required for correctly build your project with Sentry." >&2
  exit 1
else
  echo "Using Node.js from ${NODE_BINARY}"
fi

# SETUP SENTRY_PROPERTIES
if [ -z "$SENTRY_PROPERTIES" ]; then
  # Check if the script is running in the root directory
  if [ -f "./sentry.properties" ]; then
    export SENTRY_PROPERTIES=sentry.properties
  elif [ -f "../../sentry.properties" ]; then
    export SENTRY_PROPERTIES=../../sentry.properties
  else
    echo "warning: SENTRY: sentry.properties file not found! Skipping symbol upload."
    exit 0
  fi
fi

echo "sentry properties found at : $(readlink -f ${SENTRY_PROPERTIES})"
$NODE_BINARY --version

# SETUP SENTRY CLI
[ -z "$SENTRY_CLI_EXECUTABLE" ] && SENTRY_CLI_PACKAGE_PATH=$("$NODE_BINARY" --print "require('path').dirname(require.resolve('@sentry/cli/package.json'))")
[ -z "$SENTRY_CLI_EXECUTABLE" ] && SENTRY_CLI_EXECUTABLE="${SENTRY_CLI_PACKAGE_PATH}/bin/sentry-cli"

SENTRY_COMMAND="\"$SENTRY_CLI_EXECUTABLE\" upload-dsym"

# UPLOAD DEBUG SYMBOLS
if [ "$SENTRY_SKIP_DSYM_UPLOAD" != true ]; then
  # 'warning:' triggers a warning in Xcode, 'error:' triggers an error
  set +x +e # disable printing commands otherwise we might print `error:` by accident and allow continuing on error
  SENTRY_XCODE_COMMAND_OUTPUT=$(/bin/sh -c "$NODE_BINARY  $SENTRY_COMMAND"  2>&1)
  if [ $? -eq 0 ]; then
    echo "$SENTRY_XCODE_COMMAND_OUTPUT"
    echo "$SENTRY_XCODE_COMMAND_OUTPUT" | awk '{print "output: sentry-cli - " $0}'
  else
    echo "error: sentry-cli - To disable debug symbols upload, set SENTRY_SKIP_DSYM_UPLOAD=true in your environment variables. Or to allow failing upload, set SENTRY_ALLOW_FAILURE=true"
    echo "error: sentry-cli - $SENTRY_XCODE_COMMAND_OUTPUT"
  fi
  set -x -e # re-enable
else
  echo "SENTRY_SKIP_DSYM_UPLOAD=true, skipping debug symbols upload"
fi
