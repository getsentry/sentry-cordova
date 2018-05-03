.. class:: platform-cordova

.. _cordova:

Cordova
=======

This is the documentation for our Cordova SDK.  The SDK uses a native extension
for iOS and Android but will fall back to a pure JavaScript version (@sentry/browser) if needed.

Installation
------------

Start by adding Sentry and then linking it::

    $ cordova plugin add sentry-cordova

`Sentry Wizard <https://github.com/getsentry/sentry-wizard>`_ will help you to configure
your project.  We also add a build step to your Xcode project to upload debug
symbols we need to symbolicate iOS crashes.

Configuration
-------------

You have to whitelist ``sentry.io`` in your ``config.xml`` like:

    <access origin="sentry.io" />

Keep in mind if you use an on-premise installation, adjust this domain accordingly.

This example shows the bare minimum for a plain Cordova project.
Add this to you `index.js`:

.. code-block:: javascript

    onDeviceReady: function() {
        ...
        var Sentry = cordova.require("sentry-cordova.Sentry");
        Sentry.init({ dsn: '___PUBLIC_DSN___' });
        ...
    }

This will setup the Client for native and JavaScript crashes.
If you minify or bundle your code we need your sourcemap files in order to symbolicate
JavaScript errors, please see: `JavaScript sourcemaps <https://docs.sentry.io/clients/javascript/sourcemaps/>`_
for more details.

Usage
-----

*   capturing messages and error:

    .. sourcecode:: javascript

        Sentry.captureMessage('message');
        try {
          myFailingFunction();
        } catch (e) {
          Sentry.captureException(e);
        }


Note that we will track unhandled errors and promises by default.

*   adding breadcrumbs:

    .. sourcecode:: javascript

        Sentry.addBreadcrumb({ message: 'message' });


Note that we will track some breadcrumbs by default.
You can disable this by passing options into the ``init`` function:

    .. sourcecode:: javascript

        Sentry.init({ dsn: '___PUBLIC_DSN___', autoBreadcrumbs: false, instrument: false });


*   context handling:

    .. sourcecode:: javascript

        Sentry.setUserContext({ id: '123', email: 'test@sentry.io', username: 'sentry' });
        Sentry.setTagsContext({ cordova: true });
        Sentry.setExtraContext({ myData: ['1', 2, '3'] });


iOS Specifics
-------------

When you use Xcode you can hook directly into the build process to upload
debug symbols.  If you however are using bitcode you will
need to disable the "Upload Debug Symbols to Sentry" build phase and then
separately upload debug symbols from iTunes Connect to Sentry.

Run Script Phase
----------------

.. admonition:: Note

    If the wizard ran successfully, it should have done setup all the necessary steps for you.
    You can still check if everything was setup correctly.

If you want to run the debug symbol upload during building your app. You can add this as a
run script phase in Xcode. Also make sure to set the ``DEBUG_INFORMATION_FORMAT`` in your
project settings to ``DWARF and dSYM file``.

    .. sourcecode:: bash

        export SENTRY_PROPERTIES=sentry.properties
        function getProperty {
            PROP_KEY=$1
            PROP_VALUE=`cat $SENTRY_PROPERTIES | grep "$PROP_KEY" | cut -d'=' -f2`
            echo $PROP_VALUE
        }
        if [ ! -f $SENTRY_PROPERTIES ]; then
            echo "warning: SENTRY: sentry.properties file not found! Skipping symbol upload."
            exit 0
        fi
        echo "# Reading property from $SENTRY_PROPERTIES"
        SENTRY_CLI=$(getProperty "cli.executable")
        SENTRY_COMMAND="../../$SENTRY_CLI upload-dsym"
        $SENTRY_COMMAND

The next script makes sure that all unnes architectures are strip from you binary when
submitting the build to iTunes Connect.

.. admonition:: Note

    If you are getting an error while submitting your build to iTunes Connect, this script
    is probably missing. Also readding the plugin helped some people.

    .. sourcecode:: bash

        # SENTRY_FRAMEWORK_PATCH
        APP_PATH="${TARGET_BUILD_DIR}/${WRAPPER_NAME}"
        find "$APP_PATH" -name '*.framework' -type d | while read -r FRAMEWORK
        do
            FRAMEWORK_EXECUTABLE_NAME=$(defaults read "$FRAMEWORK/Info.plist" CFBundleExecutable)
            FRAMEWORK_EXECUTABLE_PATH="$FRAMEWORK/$FRAMEWORK_EXECUTABLE_NAME"
            echo "Executable is $FRAMEWORK_EXECUTABLE_PATH"
            EXTRACTED_ARCHS=()

            for ARCH in $ARCHS
            do
                echo "Extracting $ARCH from $FRAMEWORK_EXECUTABLE_NAME"
                lipo -extract "$ARCH" "$FRAMEWORK_EXECUTABLE_PATH" -o "$FRAMEWORK_EXECUTABLE_PATH-$ARCH"
                EXTRACTED_ARCHS+=("$FRAMEWORK_EXECUTABLE_PATH-$ARCH")
            done

            echo "Merging extracted architectures: ${ARCHS}"
            lipo -o "$FRAMEWORK_EXECUTABLE_PATH-merged" -create "${EXTRACTED_ARCHS[@]}"
            rm "${EXTRACTED_ARCHS[@]}"
            echo "Replacing original executable with thinned version"
            rm "$FRAMEWORK_EXECUTABLE_PATH"
            mv "$FRAMEWORK_EXECUTABLE_PATH-merged" "$FRAMEWORK_EXECUTABLE_PATH"
        done

Deep Dive
---------

.. toctree::
   :maxdepth: 2

   ionic
