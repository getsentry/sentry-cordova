Using Sentry with Ionic
-----------------------

To use Sentry with `Ionic <https://ionicframework.com/>`_ you have to add
`@sentry/cordova` as a depenendcy to you package.json.


First run ``npm i --save @sentry/cordova`` and make sure you already added the
the platfroms you want to support with ``ionic cordova platform add ios`` and/or
``ionic cordova platform add android``.


After that it's important to run ``cordova plugin add @sentry/cordova``
without the ionic wrapper.

.. admonition:: Warning

    Do not run ``ionic cordova plugin add @sentry/cordova``.
    The ionic cli wrapper sucks up all the input and sentry-wizard will not be able
    to setup your project.

When building your app with ionic for production make sure you have sourcemaps enabled.
You have to add this to your ``package.json``:

.. code-block:: javascript

    "config": {
        "ionic_generate_source_map": "true"
    }

Otherwise we are not able to upload sourcemaps to Sentry.

To setup Sentry in your codebase add this to your ``app.module.ts``:

.. code-block:: javascript

    import * as Sentry from '@sentry/core';
    import { SentryBrowser } from '@sentry/browser';
    import { SentryCordova } from '@sentry/cordova';

    Sentry.create('___DSN___')
        .use(SentryCordova, {sentryBrowser: SentryBrowser})
        .install();

Note that we try to set the release dynamically in the ``index.html``
but if it fails you should call ``setRelease``.

.. code-block:: javascript

    Sentry.create('___DSN___')
        .use(SentryCordova, {sentryBrowser: SentryBrowser})
        .install().then(client => {
            client.setRelease('your-release');
        });

In order to also use the Ionic provided ``IonicErrorHandler`` we need to add the following
to ``app.module.ts``:

.. code-block:: javascript

    class SentryIonicErrorHandler extends IonicErrorHandler {
        public handleError(error) {
            super.handleError(error);
            try {
                Sentry.getSharedClient().captureException(error.originalError || error);
            } catch (e) {
                console.error(e);
            }
        }
    }

Then change the ``@NgModule{providers:[]}`` to following:

.. code-block:: javascript

    @NgModule({
        ...
        providers: [
            StatusBar,
            SplashScreen,
            // {provide: ErrorHandler, useClass: IonicErrorHandler} remove this, add next line
            {provide: ErrorHandler, useClass: SentryIonicErrorHandler}
        ]
    })
