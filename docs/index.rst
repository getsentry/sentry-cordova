.. class:: platform-cordova

.. _corodva:

Cordova
=======

This is the documentation for our Corodva SDK.  The SDK uses a native extension
for iOS and Android but will fall back to a pure JavaScript version (raven-js) if needed.

Installation
------------

Start by adding Sentry and then linking it::

    $ cordova plugin add @sentry/cordova

Our new `Sentry Wizard <https://github.com/getsentry/sentry-wizard>`_ will help you to
configure your project.  We also add a build step to your Xcode project to upload debug
symbols we need to symbolicate iOS crashes.

Configuration
-------------

You have to whitelist ``sentry.io`` in your ``config.xml`` like:

    <access origin="sentry.io" />

Keep in mind if you use an on-premise installation, adjust this domain accordingly.

This example shows the bare minium for a plain Cordova project.
Add this to you `index.js`:

.. code-block:: javascript

    onDeviceReady: function() {
        ...
        var Sentry = cordova.require("sentry-cordova.SentryCordovaBundle").default;
        var SentryBrowser = cordova.require("sentry-cordova.SentryCordovaBundle").SentryBrowser;
        var SentryCordova = cordova.require("sentry-cordova.SentryCordovaBundle").SentryCordova;

        Sentry.create('___DSN___')
            .use(SentryCordova, {sentryBrowser: SentryBrowser})
            .install();
        ...
    }

This will setup the Client for native and JavaScript crashes.
If you minify or bundle your code we need your sourcemap files in order to symbolicate
JavaScript errors, please see: `JavaScript sourcemaps <https://docs.sentry.io/clients/javascript/sourcemaps/>`_
for more details.

iOS Specifics
-------------

When you use Xcode you can hook directly into the build process to upload
debug symbols.  If you however are using bitcode you will
need to disable the "Upload Debug Symbols to Sentry" build phase and then
separately upload debug symbols from iTunes Connect to Sentry.

Deep Dive
---------

.. toctree::
   :maxdepth: 2

   ionic
